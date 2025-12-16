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
    
    ## // UI
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
