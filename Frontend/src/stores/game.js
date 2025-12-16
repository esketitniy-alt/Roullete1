import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const useGameStore = defineStore('game', {
  state: () => ({
    // Пользователь
    user: null,
    token: localStorage.getItem('token'),
    
    // Сокет
    socket: null,
    connected: false,
    onlineCount: 0,
    
    // Игра
    gamePhase: 'betting',
    timeLeft: 25,
    currentRoundId: 1,
    currentBets: [],
    lastResults: [],
    winningSectorIndex: null,
    isSpinning: false,
    
    // Конфигурация
    sectors: [],
    multipliers: { red: 2, black: 2, green: 14 },
    minBet: 10,
    maxBet: 10000,
    
    // UI
    showAuth: false,
    showProfile: false,
    showAdmin: false,
    notification: null,
    
    // Статистика пользователя
    userStats: null,
    userBets: []
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.isAdmin || false,
    canBet: (state) => state.gamePhase === 'betting' && state.isAuthenticated
  },
  
  actions: {
    // Инициализация
    async init() {
      if (this.token) {
        await this.fetchProfile();
      }
      this.connectSocket();
    },
    
    // Подключение сокета
    connectSocket() {
      this.socket = io(API_URL, {
        auth: { token: this.token }
      });
      
      this.socket.on('connect', () => {
        this.connected = true;
        console.log('✅ Подключено к серверу');
      });
      
      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('❌ Отключено от сервера');
      });
      
      // Состояние игры
      this.socket.on('gameState', (data) => {
        this.gamePhase = data.phase;
        this.timeLeft = data.timeLeft;
        this.currentRoundId = data.currentRoundId;
        this.currentBets = data.currentBets || [];
        this.lastResults = data.lastResults || [];
        this.sectors = data.sectors || [];
        this.multipliers = data.multipliers || this.multipliers;
        this.minBet = data.minBet || 10;
        this.maxBet = data.maxBet || 10000;
      });
      
      // Таймер
      this.socket.on('timerUpdate', (data) => {
        this.gamePhase = data.phase;
        this.timeLeft = data.timeLeft;
      });
      
      // Обновление ставок
      this.socket.on('betsUpdate', (bets) => {
        this.currentBets = bets;
      });
      
      // Начало кручения
      this.socket.on('spinStart', (data) => {
        this.gamePhase = 'spinning';
        this.isSpinning = true;
        this.winningSectorIndex = data.winningSectorIndex;
      });
      
      // Результат раунда
      this.socket.on('roundResult', (data) => {
        this.gamePhase = 'result';
        this.isSpinning = false;
        this.lastResults = data.lastResults;
        this.currentRoundId = data.roundId + 1;
      });
      
      // Обновление баланса
      this.socket.on('balanceUpdate', (balance) => {
        if (this.user) {
          this.user.balance = balance;
        }
      });
      
      // Выигрыш
      this.socket.on('win', (data) => {
        this.showNotification(`🎉 Вы выиграли ${data.amount} монет!`, 'success');
      });
      
      // Ошибка
      this.socket.on('error', (data) => {
        this.showNotification(data.message, 'error');
      });
      
      // Ставка принята
      this.socket.on('betPlaced', (data) => {
        this.showNotification(data.message, 'success');
      });
      
      // Онлайн
      this.socket.on('onlineCount', (count) => {
        this.onlineCount = count;
      });
    },
    
    // Переподключение сокета после авторизации
    reconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.connectSocket();
    },
    
    // Авторизация
    async login(username, password) {
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/login`, {
          username,
          password
        });
        
        this.token = data.token;
        this.user = data;
        localStorage.setItem('token', data.token);
        
        this.reconnectSocket();
        this.showAuth = false;
        this.showNotification('Добро пожаловать!', 'success');
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Ошибка входа' 
        };
      }
    },
    
    // Регистрация
    async register(username, password) {
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/register`, {
          username,
          password
        });
        
        this.token = data.token;
        this.user = data;
        localStorage.setItem('token', data.token);
        
        this.reconnectSocket();
        this.showAuth = false;
        this.showNotification('Регистрация успешна! Вам начислено 1000 монет.', 'success');
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Ошибка регистрации' 
        };
      }
    },
    
    // Выход
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      this.reconnectSocket();
      this.showProfile = false;
      this.showAdmin = false;
      this.showNotification('Вы вышли из аккаунта', 'info');
    },
    
    // Получить профиль
    async fetchProfile() {
      try {
        const { data } = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.user = data;
      } catch (error) {
        this.logout();
      }
    },
    
    // Получить статистику
    async fetchStats() {
      try {
        const { data } = await axios.get(`${API_URL}/api/game/stats`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.userStats = data.stats;
        this.userBets = data.recentBets;
      } catch (error) {
        console.error('Ошибка загрузки статистики');
      }
    },
    
    // Получить историю ставок
    async fetchMyBets() {
      try {
        const { data } = await axios.get(`${API_URL}/api/game/my-bets`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.userBets = data;
      } catch (error) {
        console.error('Ошибка загрузки ставок');
      }
    },
    
    // Сделать ставку
    placeBet(color, amount) {
      if (!this.canBet) {
        this.showNotification('Сейчас нельзя делать ставки', 'error');
        return;
      }
      
      if (amount < this.minBet || amount > this.maxBet) {
        this.showNotification(`Ставка должна быть от ${this.minBet} до ${this.maxBet}`, 'error');
        return;
      }
      
      if (this.user.balance < amount) {
        this.showNotification('Недостаточно средств', 'error');
        return;
      }
      
      this.socket.emit('placeBet', { color, amount });
    },
    
    // Уведомление
    showNotification(message, type = 'info') {
      this.notification = { message, type };
      setTimeout(() => {
        this.notification = null;
      }, 3000);
    }
  }
});
