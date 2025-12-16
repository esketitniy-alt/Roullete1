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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Подключение к БД
connectDB();

// ==================== КОНФИГУРАЦИЯ РУЛЕТКИ ====================

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

const MULTIPLIERS = { red: 2, black: 2, green: 14 };
const MIN_BET = 10;
const MAX_BET = 10000;
const BETTING_TIME = 25000;
const SPIN_TIME = 8000;
const RESULT_TIME = 5000;

// ==================== СОСТОЯНИЕ ИГРЫ ====================

let gameState = {
  currentRoundId: 1,
  phase: 'betting',
  timeLeft: BETTING_TIME / 1000,
  currentBets: [],
  lastResults: [],
  winningSector: null,
  winningSectorIndex: null
};

const onlineUsers = new Map();
const userSockets = new Map();

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

const initializeGame = async () => {
  try {
    const lastRound = await Round.findOne().sort({ roundId: -1 });
    if (lastRound) {
      gameState.currentRoundId = lastRound.roundId + 1;
    }
    
    const lastResults = await Round.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(15);
    
    gameState.lastResults = lastResults.map(r => ({
      sector: r.result.sector,
      color: r.result.color
    }));
    
    console.log(`🎮 Игра инициализирована. Текущий раунд: ${gameState.currentRoundId}`);
  } catch (error) {
    console.error('Ошибка инициализации:', error);
  }
};

// ==================== АУТЕНТИФИКАЦИЯ СОКЕТА ====================

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-12345');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        socket.user = user;
        socket.odId = user._id.toString();
      }
    }
    next();
  } catch (error) {
    next();
  }
};

io.use(authenticateSocket);

// ==================== SOCKET.IO ОБРАБОТЧИКИ ====================

io.on('connection', (socket) => {
  console.log(`🔌 Подключение: ${socket.id}${socket.user ? ` (${socket.user.username})` : ' (гость)'}`);
  
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
    onlineUsers.set(socket.odId, {
      odId: socket.odId,
      username: socket.user.username
    });
    userSockets.set(socket.odId, socket);
    socket.emit('balanceUpdate', socket.user.balance);
  }
  
  io.emit('onlineCount', onlineUsers.size);
  
  // ==================== РАЗМЕЩЕНИЕ СТАВКИ ====================
  
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
      
      if (!['red', 'black', 'green'].includes(color)) {
        socket.emit('error', { message: 'Неверный цвет' });
        return;
      }
      
      const betAmount = parseInt(amount);
      if (isNaN(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
        socket.emit('error', { message: `Ставка должна быть от ${MIN_BET} до ${MAX_BET}` });
        return;
      }
      
      // Проверяем количество цветов (максимум 2)
      const userBets = gameState.currentBets.filter(b => b.odId === socket.odId);
      const userColors = [...new Set(userBets.map(b => b.color))];
      
      if (!userColors.includes(color) && userColors.length >= 2) {
        socket.emit('error', { message: 'Можно ставить только на 2 цвета за раунд' });
        return;
      }
      
      // Проверяем баланс
      const user = await User.findById(socket.odId);
      if (!user) {
        socket.emit('error', { message: 'Пользователь не найден' });
        return;
      }
      
      if (user.balance < betAmount) {
        socket.emit('error', { message: 'Недостаточно средств' });
        return;
      }
      
      // Списываем баланс
      user.balance -= betAmount;
      await user.save();
      
      // Создаем ставку в БД
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
        betId: bet._id.toString(),
        username: user.username,
        color,
        amount: betAmount
      };
      
      gameState.currentBets.push(betData);
      
      // Обновляем баланс пользователя
      socket.emit('balanceUpdate', user.balance);
      
      // Отправляем всем обновленные ставки
      io.emit('betsUpdate', gameState.currentBets);
      
      const colorName = color === 'red' ? 'красное' : color === 'black' ? 'черное' : 'зеленое';
      socket.emit('betPlaced', { 
        message: `Ставка ${betAmount} на ${colorName} принята`,
        bet: betData 
      });
      
      console.log(`💰 ${user.username} поставил ${betAmount} на ${color}`);
      
    } catch (error) {
      console.error('Ошибка ставки:', error);
      socket.emit('error', { message: 'Ошибка при размещении ставки' });
    }
  });
  
  // Запрос баланса
  socket.on('getBalance', async () => {
    if (socket.user) {
      const user = await User.findById(socket.odId);
      if (user) {
        socket.emit('balanceUpdate', user.balance);
      }
    }
  });
  
  // Отключение
  socket.on('disconnect', () => {
    console.log(`❌ Отключение: ${socket.id}`);
    if (socket.odId) {
      onlineUsers.delete(socket.odId);
      userSockets.delete(socket.odId);
      io.emit('onlineCount', onlineUsers.size);
    }
  });
});

// ==================== ИГРОВАЯ ЛОГИКА ====================

const spinRoulette = () => {
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
  
  console.log(`🎯 Результат: ${sector.number} (${sector.color})`);
  
  // Группируем ставки по пользователям
  const userBetsMap = new Map();
  
  for (const bet of gameState.currentBets) {
    if (!userBetsMap.has(bet.odId)) {
      userBetsMap.set(bet.odId, []);
    }
    userBetsMap.get(bet.odId).push(bet);
  }
  
  // Обрабатываем каждого пользователя
  for (const [odId, bets] of userBetsMap) {
    let userWinnings = 0;
    let userWins = 0;
    
    for (const bet of bets) {
      const won = bet.color === sector.color;
      const payout = won ? bet.amount * MULTIPLIERS[bet.color] : 0;
      
      if (won) {
        userWinnings += payout;
        userWins++;
        totalPayout += payout;
      }
      
      // Обновляем ставку в БД
      await Bet.findOneAndUpdate(
        { user: odId, roundId: gameState.currentRoundId, color: bet.color, amount: bet.amount },
        { won, payout }
      );
    }
    
    // Обновляем баланс и статистику пользователя
    const user = await User.findById(odId);
    if (user) {
      if (userWinnings > 0) {
        user.balance += userWinnings;
      }
      
      user.totalBets += bets.length;
      user.totalWins += userWins;
      user.totalWagered += bets.reduce((sum, b) => sum + b.amount, 0);
      user.totalWon += userWinnings;
      
      await user.save();
      
      // Отправляем обновление баланса
      const userSocket = userSockets.get(odId);
      if (userSocket) {
        userSocket.emit('balanceUpdate', user.balance);
        
        if (userWinnings > 0) {
          userSocket.emit('win', { 
            amount: userWinnings,
            message: `Вы выиграли ${userWinnings} монет!`
          });
        }
      }
    }
  }
  
  // Сохраняем раунд
  await Round.create({
    roundId: gameState.currentRoundId,
    result: {
      sector: sector.number,
      color: sector.color
    },
    totalBets: gameState.currentBets.reduce((sum, b) => sum + b.amount, 0),
    totalPayout,
    status: 'completed',
    completedAt: new Date()
  });
  
  // Обновляем историю результатов
  gameState.lastResults.unshift({
    sector: sector.number,
    color: sector.color
  });
  
  if (gameState.lastResults.length > 15) {
    gameState.lastResults.pop();
  }
  
  return totalPayout;
};

// ==================== ИГРОВОЙ ЦИКЛ ====================

const startGameLoop = () => {
  let timer = BETTING_TIME / 1000;
  
  const gameLoop = async () => {
    // Фаза ставок
    gameState.phase = 'betting';
    gameState.currentBets = [];
    timer = BETTING_TIME / 1000;
    
    console.log(`\n🎰 Раунд #${gameState.currentRoundId} - Приём ставок`);
    
    io.emit('gameState', {
      ...gameState,
      sectors: SECTORS,
      multipliers: MULTIPLIERS,
      minBet: MIN_BET,
      maxBet: MAX_BET
    });
    
    // Таймер ставок
    const bettingInterval = setInterval(() => {
      timer--;
      gameState.timeLeft = timer;
      
      io.emit('timerUpdate', {
        phase: 'betting',
        timeLeft: timer
      });
      
      if (timer <= 0) {
        clearInterval(bettingInterval);
      }
    }, 1000);
    
    // Ждем окончания времени ставок
    await new Promise(resolve => setTimeout(resolve, BETTING_TIME));
    clearInterval(bettingInterval);
    
    // Фаза кручения
    gameState.phase = 'spinning';
    const result = spinRoulette();
    gameState.winningSectorIndex = result.sectorIndex;
    gameState.winningSector = result.sector;
    
    console.log(`🎡 Кручение... Выпадет: ${result.sector.number} (${result.sector.color})`);
    
    io.emit('spinStart', {
      winningSectorIndex: result.sectorIndex
    });
    
    io.emit('timerUpdate', {
      phase: 'spinning',
      timeLeft: SPIN_TIME / 1000
    });
    
    // Ждем окончания анимации
    await new Promise(resolve => setTimeout(resolve, SPIN_TIME));
    
    // Фаза результатов
    gameState.phase = 'result';
    
    const totalPayout = await processResults(result);
    
    console.log(`💵 Выплачено: ${totalPayout}`);
    
    io.emit('roundResult', {
      roundId: gameState.currentRoundId,
      result: result.sector,
      lastResults: gameState.lastResults
    });
    
    io.emit('timerUpdate', {
      phase: 'result',
      timeLeft: RESULT_TIME / 1000
    });
    
    // Ждем показа результата
    await new Promise(resolve => setTimeout(resolve, RESULT_TIME));
    
    // Следующий раунд
    gameState.currentRoundId++;
    gameState.winningSectorIndex = null;
    gameState.winningSector = null;
    
    // Запускаем следующий раунд
    gameLoop();
  };
  
  gameLoop();
};

// ==================== СОЗДАНИЕ АДМИНА ====================

const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        balance: 100000,
        isAdmin: true
      });
      console.log('👑 Создан администратор: admin / admin123');
    }
  } catch (error) {
    console.error('Ошибка создания админа:', error);
  }
};

// ==================== ЗАПУСК СЕРВЕРА ====================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, async () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 WebSocket готов к подключениям`);
  
  await createDefaultAdmin();
  await initializeGame();
  startGameLoop();
});
