<template>
  <div class="app">
    <!-- Хедер -->
    <header class="header">
      <div class="header-left">
        <h1 class="logo">🎰 ROULETTE</h1>
        <span class="online-badge">
          <span class="online-dot"></span>
          {{ store.onlineCount }} онлайн
        </span>
      </div>
      
      <div class="header-right">
        <template v-if="store.isAuthenticated">
          <div class="balance-display">
            <span class="balance-label">Баланс:</span>
            <span class="balance-amount">{{ store.user?.balance?.toLocaleString() }} 🪙</span>
          </div>
          
          <button class="btn btn-secondary" @click="store.showProfile = true">
            👤 {{ store.user?.username }}
          </button>
          
          <button 
            v-if="store.isAdmin" 
            class="btn btn-gold" 
            @click="store.showAdmin = true"
          >
            ⚙️ Админ
          </button>
          
          <button class="btn btn-secondary" @click="store.logout()">
            Выход
          </button>
        </template>
        
        <template v-else>
          <button class="btn btn-primary" @click="store.showAuth = true">
            Войти / Регистрация
          </button>
        </template>
      </div>
    </header>
    
    <!-- Основной контент -->
    <main class="main-content">
      <!-- Таймер и статус -->
      <div class="game-status">
        <div class="round-info">
          Раунд #{{ store.currentRoundId }}
        </div>
        <div class="timer" :class="timerClass">
          <template v-if="store.gamePhase === 'betting'">
            ⏱️ Ставки: {{ store.timeLeft }}с
          </template>
          <template v-else-if="store.gamePhase === 'spinning'">
            🎰 Крутится...
          </template>
          <template v-else>
            ✅ Результат!
          </template>
        </div>
      </div>
      
      <!-- История последних результатов -->
      <div class="results-history">
        <div 
          v-for="(result, index) in store.lastResults.slice(0, 15)" 
          :key="index"
          class="result-item"
          :class="result.color"
        >
          {{ result.sector }}
        </div>
      </div>
      
      <!-- Рулетка -->
      <Roulette />
      
      <!-- Панель ставок -->
      <BettingPanel />
      
      <!-- Текущие ставки -->
      <CurrentBets />
    </main>
    
    <!-- Модальные окна -->
    <AuthModal v-if="store.showAuth" />
    <UserProfile v-if="store.showProfile" />
    <AdminPanel v-if="store.showAdmin" />
    
    <!-- Уведомления -->
    <div 
      v-if="store.notification" 
      class="notification" 
      :class="store.notification.type"
    >
      {{ store.notification.message }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useGameStore } from './stores/game';
import Roulette from './components/Roulette.vue';
import BettingPanel from './components/BettingPanel.vue';
import CurrentBets from './components/CurrentBets.vue';
import AuthModal from './components/AuthModal.vue';
import UserProfile from './components/UserProfile.vue';
import AdminPanel from './components/AdminPanel.vue';

const store = useGameStore();

const timerClass = computed(() => ({
  'timer-warning': store.gamePhase === 'betting' && store.timeLeft <= 5,
  'timer-spinning': store.gamePhase === 'spinning'
}));

onMounted(() => {
  store.init();
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  font-size: 28px;
  font-weight: 900;
  background: linear-gradient(135deg, var(--gold) 0%, #ffed4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.online-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 210, 106, 0.2);
  border-radius: 20px;
  font-size: 14px;
  color: var(--green);
}

.online-dot {
  width: 8px;
  height: 8px;
  background: var(--green);
  border-radius: 50%;
  animation: pulse 1.5s ease infinite;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 237, 74, 0.1) 100%);
  border: 2px solid var(--gold);
  border-radius: 12px;
}

.balance-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.balance-amount {
  color: var(--gold);
  font-size: 18px;
  font-weight: 700;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 24px;
}

.game-status {
  display: flex;
  align-items: center;
  gap: 32px;
}

.round-info {
  font-size: 18px;
  color: var(--text-secondary);
}

.timer {
  font-size: 24px;
  font-weight: 700;
  padding: 12px 32px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 2px solid var(--accent);
}

.timer-warning {
  border-color: var(--error);
  color: var(--error);
  animation: pulse 0.5s ease infinite;
}

.timer-spinning {
  border-color: var(--gold);
  color: var(--gold);
  animation: glow 1s ease infinite;
}

.results-history {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow-x: auto;
  max-width: 100%;
}

.result-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.result-item.red {
  background: var(--red);
}

.result-item.black {
  background: #2d2d2d;
  border: 2px solid #555;
}

.result-item.green {
  background: var(--green);
  color: #1a1a2e;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .header-right {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .game-status {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
