import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';
import Bet from './models/Bet.js';
import Round from './models/Round.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Подключение к БД
connectDB();

// ==================== ИГРОВАЯ ЛОГИКА ====================

// Конфигурация рулетки - 15 секторов
const SECTORS = [
  { number: 0, color: 'green' },
  { number: 1, color: 'red' },
  { number: 2, color: 'black' },
  { number: 3, color: 'red' },
  { number: 4, color: 'black' },
  { number: 5, color: 'red' },
  { number: 6, color: 'black' },
  { number: 7, color: 'red' },
  { number: 8, color: 'black' },
  { number: 9, color: 'red' },
  { number: 10, color: 'black' },
  { number: 11, color: 'red' },
  { number: 12, color: 'black' },
  { number: 13, color: 'red' },
  { number: 14, color: 'black' }
];

const MULTIPLIERS = {
  red: 2,
  black: 2,
  green: 14
};

const MIN_BET = 10;
const MAX_BET = 10000;
const BETTING_TIME = 25000; // 25 секунд на ставки
const SPIN_TIME = 8000; // 8 секунд кручение

// Состояние игры
let gameState = {
  currentRoundId: 1,
  phase: 'betting', // 'betting', 'spinning', 'result'
  timeLeft: BETTING_TIME / 1000,
  currentBets: [],
  lastResults: [],
  winningSector: null
};

// Онлайн пользователи
const onlineUsers = new Map();

// Аутентификация сокета
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        socket.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

io.use(authenticateSocket);

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log(`🔌 Подключение: ${socket.id}`);
  
  // Отправляем текущее состояние игры
  socket.emit('gameState', {
    ...gameState,
    sectors: SECTORS,
    multipliers: MULTIPLIERS,
    minBet: MIN_BET,
    maxBet: MAX_BET
  });
  
  // Регистрация пользователя
  if (socket.user) {
    onlineUsers.set(socket.user._id.toString(), {
      odId: socket.id,
      username: socket.user.username
    });
    io.emit('onlineCount', onlineUsers.size);
  }
  
  // Размещение ставки
  socket.on('placeBet', async (data) => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Необходимо авторизоваться' });
        return;
      }
      
      if (gameState.phase !== 'betting') {
        socket.emit('error', { message: 'Ставки закрыты' });
        return;
      }
      
      const { color, amount } = data;
      
      // Валидация цвета
      if (!['red', 'black', 'green'].includes(color)) {
        socket.emit('error', { message: 'Неверный цвет' });
        return;
      }
      
      // Валидация суммы
      const betAmount = parseInt(amount);
      if (isNaN(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
        socket.emit('error', { message: `Ставка должна быть от ${MIN_BET} до ${MAX_BET}` });
        return;
      }
      
      // Проверяем количество цветов, на которые уже поставил пользователь
      const userBets = gameState.currentBets.filter(
        b => b.odId === socket.user._id.toString()
      );
      const userColors = [...new Set(userBets.map(b => b.color))];
      
      if (!userColors.includes(color) && userColors.length >= 2) {
        socket.emit('error', { message: 'Можно ставить только на 2 цвета за раунд' });
        return;
      }
      
      // Проверяем баланс
      const user = await User.findById(socket.user._id);
      if (user.balance < betAmount) {
        socket.emit('error', { message: 'Недостаточно средств' });
        return;
      }
      
      // Списываем баланс
      user.balance -= betAmount;
      await user.save();
      
      // Создаем ставку
      const bet = await Bet.create({
        user: user._id,
        username: user.username,
        roundId: gameState.currentRoundId,
        color,
        amount: betAmount
      });
      
      // Добавляем в текущие ставки
      const betData = {
        odId: user._id.toString(),
        odId: bet._id.toString(),
        username: user.username,
        color,
        amount: betAmount
      };
      
      gameState.currentBets.push(betData);
      
      // Обновляем баланс пользователя
      socket.emit('balanceUpdate', user.balance);
      
      // Отправляем всем обновленные ставки
      io.emit('betsUpdate', gameState.currentBets);
      
      socket.emit('betPlaced', { message: 'Ставка принята', bet: betData });
      
    } catch (error) {
      console.error('Ошибка ставки:', error);
      socket.emit('error', { message: 'Ошибка при размещении ставки' });
    }
  });
  
  // Запрос баланса
  socket.on('getBalance', async () => {
    if (socket.user) {
      const user = await User.findById(socket.user._id);
      socket.emit('balanceUpdate', user.balance);
    }
  });
  
  // Отключение
  socket.on('disconnect', () => {
    console.log(`❌ Отключение: ${socket.id}`);
    if (socket.user) {
      onlineUsers.delete(socket.user._id.toString());
      io.emit('onlineCount', onlineUsers.size);
    }
  });
});

// ==================== ИГРОВОЙ ЦИКЛ ====================

const spinRoulette = () => {
  // Случайный сектор
  const winningSectorIndex = Math.floor(Math.random() * SECTORS.length);
  const winningSector = SECTORS[winningSectorIndex];
  
  return {
    sectorIndex: winningSectorIndex,
    sector: winningSector
  };
};

const processResults = async (result) => {
  const { sector } = result;
  let totalPayout = 0;
  
  // Обрабатываем все ставки
  for (const bet of gameState.currentBets) {
    const betDoc = await Bet.findById(bet.betId);
    if (!betDoc) continue;
    
    const won = betDoc.color === sector.color;
    const payout = won ? betDoc.amount * MULTIPLIERS[sector.color] : 0;
    
    betDoc.won = won;
    betDoc.payout = payout;
    await betDoc.save();
    
    if (won) {
      // Начисляем выигрыш
      const user = await User.findById(betDoc.user);
      if (user) {
        user.balance += payout;
        user.totalWins += 1;
        user.totalWon += payout;
        await user.save();
        
        // Отправляем обновление баланса победителю
        const userSocket = [...io.sockets.sockets.values()].find(
          s => s.user?._id.toString() === user._id.toString()
        );
        if (userSocket) {
          userSocket.emit('balanceUpdate', user.balance);
          userSocket.emit('win', { amount: payout, color: sector.color });
        }
      }
    }
    
    // Обновляем статистику пользователя
    const user = await User.findById(betDoc.user);
    if (user) {
      user.totalBets += 1;
      user.totalWagered += betDoc.amount;
      await user.save();
    }
    
    totalPayout += payout;
  }
  
  return totalPayout;
};

const gameLoop = async () => {
  // Фаза ставок
  gameState.phase = 'betting';
  gameState.currentBets = [];
  gameState.winningSector = null;
  
  // Создаем раунд
  const round = await Round.create({
    roundId: gameState.currentRoundId,
    status: 'betting'
  });
  
  io.emit('gameState', {
    ...gameState,
    sectors: SECTORS,
    multipliers: MULTIPLIERS,
    minBet: MIN_BET,
    maxBet: MAX_BET
  });
  
  // Таймер ставок
  let timeLeft = BETTING_TIME / 1000;
  const bettingInterval = setInterval(() => {
    timeLeft--;
    gameState.timeLeft = timeLeft;
    io.emit('timerUpdate', { phase: 'betting', timeLeft });
    
    if (timeLeft <= 0) {
      clearInterval(bettingInterval);
    }
  }, 1000);
  
  // Ждем окончания времени ставок
  await new Promise(resolve => setTimeout(resolve, BETTING_TIME));
  
  // Фаза кручения
  gameState.phase = 'spinning';
  const spinResult = spinRoulette();
  gameState.winningSector = spinResult;
  
  round.status = 'spinning';
  await round.save();
  
  io.emit('spinStart', {
    phase: 'spinning',
    duration: SPIN_TIME,
    winningSectorIndex: spinResult.sectorIndex
  });
  
  // Ждем окончания анимации
  await new Promise(resolve => setTimeout(resolve, SPIN_TIME));
  
  // Фаза результатов
  gameState.phase = 'result';
  
  const totalPayout = await processResults(spinResult);
  
  // Обновляем раунд
  round.result = {
    sector: spinResult.sector.number,
    color: spinResult.sector.color
  };
  round.totalBets = gameState.currentBets.reduce((sum, b) => sum + b.amount, 0);
  round.totalPayout = totalPayout;
  round.status = 'completed';
  round.completedAt = new Date();
  await round.save();
  
  // Добавляем в историю
  gameState.lastResults.unshift({
    roundId: gameState.currentRoundId,
    sector: spinResult.sector.number,
    color: spinResult.sector.color
  });
  
  // Храним только последние 20 результатов
  if (gameState.lastResults.length > 20) {
    gameState.lastResults.pop();
  }
  
  io.emit('roundResult', {
    roundId: gameState.currentRoundId,
    result: spinResult.sector,
    lastResults: gameState.lastResults
  });
  
  // Следующий раунд
  gameState.currentRoundId++;
  
  // Пауза перед следующим раундом
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Запускаем следующий раунд
  gameLoop();
};

// Инициализация игры
const initGame = async () => {
  // Получаем последний раунд
  const lastRound = await Round.findOne().sort({ roundId: -1 });
  if (lastRound) {
    gameState.currentRoundId = lastRound.roundId + 1;
  }
  
  // Загружаем последние результаты
  const lastResults = await Round.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(20);
  
  gameState.lastResults = lastResults.map(r => ({
    roundId: r.roundId,
    sector: r.result?.sector,
    color: r.result?.color
  })).filter(r => r.sector !== undefined);
  
  // Запускаем игровой цикл
  gameLoop();
};

// Создание админа при первом запуске
const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ isAdmin: true });
  if (!adminExists) {
    await User.create({
      username: 'admin',
      password: 'admin123',
      balance: 100000,
      isAdmin: true
    });
    console.log('✅ Создан администратор: admin / admin123');
  }
};

// Запуск сервера
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  await createDefaultAdmin();
  await initGame();
});
