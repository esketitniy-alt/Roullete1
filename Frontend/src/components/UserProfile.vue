<template>
  <div class="modal-overlay" @click.self="store.showProfile = false">
    <div class="modal modal-large">
      <button class="modal-close" @click="store.showProfile = false">✕</button>
      
      <h2>👤 Профиль</h2>
      
      <div class="profile-header">
        <div class="avatar">
          {{ store.user?.username?.charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <h3>{{ store.user?.username }}</h3>
          <p class="join-date">Зарегистрирован: {{ formatDate(store.user?.createdAt) }}</p>
          <p v-if="store.user?.isAdmin" class="admin-badge">👑 Администратор</p>
        </div>
        <div class="balance-card">
          <span class="balance-label">Баланс</span>
          <span class="balance-value">{{ store.user?.balance?.toLocaleString() }} 🪙</span>
        </div>
      </div>
      
      <div class="stats-grid" v-if="stats">
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalBets }}</span>
          <span class="stat-label">Всего ставок</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalWins }}</span>
          <span class="stat-label">Выигрышей</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.winRate }}%</span>
          <span class="stat-label">Винрейт</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalWagered?.toLocaleString() }} 🪙</span>
          <span class="stat-label">Поставлено</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalWon?.toLocaleString() }} 🪙</span>
          <span class="stat-label">Выиграно</span>
        </div>
        <div class="stat-card" :class="{ profit: stats.profit >= 0, loss: stats.profit < 0 }">
          <span class="stat-value">
            {{ stats.profit >= 0 ? '+' : '' }}{{ stats.profit?.toLocaleString() }} 🪙
          </span>
          <span class="stat-label">Профит</span>
        </div>
      </div>
      
      <div class="bets-history">
        <h3>📜 История ставок</h3>
        
        <div class="history-tabs">
          <button :class="{ active: historyTab === 'all' }" @click="historyTab = 'all'">
            Все ({{ bets.length }})
          </button>
          <button :class="{ active: historyTab === 'wins' }" @click="historyTab = 'wins'">
            Выигрыши ({{ winBets.length }})
          </button>
          <button :class="{ active: historyTab === 'losses' }" @click="historyTab = 'losses'">
            Проигрыши ({{ lossBets.length }})
          </button>
        </div>
        
        <div class="history-list" v-if="filteredBets.length > 0">
          <div 
            v-for="bet in filteredBets" 
            :key="bet._id"
            class="history-item"
            :class="{ won: bet.won === true, lost: bet.won === false, pending: bet.won === null }"
          >
            <div class="bet-main">
              <div class="bet-info">
                <span class="bet-round">Раунд #{{ bet.roundId }}</span>
                <span class="bet-date">{{ formatDate(bet.createdAt) }}</span>
              </div>
              <div class="bet-details">
                <span class="bet-color" :class="bet.color">
                  {{ getColorIcon(bet.color) }} {{ getColorName(bet.color) }}
                </span>
                <span class="bet-amount">{{ bet.amount.toLocaleString() }} 🪙</span>
              </div>
            </div>
            <div class="bet-result">
              <template v-if="bet.won === true">
                <span class="result-win">+{{ bet.payout.toLocaleString() }} 🪙</span>
                <span class="result-icon">✅</span>
              </template>
              <template v-else-if="bet.won === false">
                <span class="result-loss">-{{ bet.amount.toLocaleString() }} 🪙</span>
                <span class="result-icon">❌</span>
              </template>
              <template v-else>
                <span class="result-pending">Ожидание</span>
                <span class="result-icon">⏳</span>
              </template>
            </div>
          </div>
        </div>
        
        <div v-else class="no-history">
          <p>📭 Нет ставок для отображения</p>
        </div>
        
        <button 
          v-if="hasMoreBets" 
          class="btn btn-secondary load-more" 
          @click="loadMoreBets"
          :disabled="loadingMore"
        >
          {{ loadingMore ? '⏳ Загрузка...' : 'Загрузить еще' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import axios from 'axios';

const store = useGameStore();
const API_URL = 'http://localhost:3000';

const stats = ref(null);
const bets = ref([]);
const historyTab = ref('all');
const currentPage = ref(1);
const totalPages = ref(1);
const loadingMore = ref(false);

const colorNames = { red: 'Красное', black: 'Черное', green: 'Зеленое' };
const colorIcons = { red: '🔴', black: '⚫', green: '🟢' };

const getColorName = (color) => colorNames[color] || color;
const getColorIcon = (color) => colorIcons[color] || '';

const winBets = computed(() => bets.value.filter(b => b.won === true));
const lossBets = computed(() => bets.value.filter(b => b.won === false));

const filteredBets = computed(() => {
  switch (historyTab.value) {
    case 'wins': return winBets.value;
    case 'losses': return lossBets.value;
    default: return bets.value;
  }
});

const hasMoreBets = computed(() => currentPage.value < totalPages.value);

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadStats = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/api/game/stats`, {
      headers: { Authorization: `Bearer ${store.token}` }
    });
    stats.value = data.stats;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadBets = async (page = 1) => {
  try {
    const { data } = await axios.get(`${API_URL}/api/game/my-bets?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${store.token}` }
    });
    
    if (page === 1) {
      bets.value = data.bets;
    } else {
      bets.value = [...bets.value, ...data.bets];
    }
    
    currentPage.value = data.page;
    totalPages.value = data.pages;
  } catch (error) {
    console.error('Ошибка загрузки ставок:', error);
  }
};

const loadMoreBets = async () => {
  if (loadingMore.value || !hasMoreBets.value) return;
  
  loadingMore.value = true;
  await loadBets(currentPage.value + 1);
  loadingMore.value = false;
};

onMounted(() => {
  loadStats();
  loadBets();
});
</script>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  margin-bottom: 24px;
}

.avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--accent) 0%, #9d4edd 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  font-size: 24px;
  margin-bottom: 8px;
}

.join-date {
  color: var(--text-secondary);
  font-size: 14px;
}

.admin-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--gold) 0%, #ffed4a 100%);
  color: #1a1a2e;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.balance-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 32px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 237, 74, 0.1) 100%);
  border: 2px solid var(--gold);
  border-radius: 16px;
}

.balance-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.balance-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-card.profit {
  border-color: var(--green);
  background: rgba(0, 210, 106, 0.1);
}

.stat-card.profit .stat-value {
  color: var(--green);
}

.stat-card.loss {
  border-color: var(--red);
  background: rgba(233, 69, 96, 0.1);
}

.stat-card.loss .stat-value {
  color: var(--red);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.bets-history h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.history-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.history-tabs button {
  flex: 1;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-tabs button:hover {
  background: rgba(0, 0, 0, 0.3);
}

.history-tabs button.active {
  border-color: var(--accent);
  color: var(--text-primary);
  background: rgba(123, 44, 191, 0.2);
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

.history-item.won {
  border-left-color: var(--green);
}

.history-item.lost {
  border-left-color: var(--red);
}

.history-item.pending {
  border-left-color: var(--gold);
}

.bet-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bet-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.bet-round {
  font-weight: 600;
  color: var(--text-primary);
}

.bet-details {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bet-color {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.bet-color.red {
  background: rgba(233, 69, 96, 0.2);
  color: var(--red);
}

.bet-color.black {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.bet-color.green {
  background: rgba(0, 210, 106, 0.2);
  color: var(--green);
}

.bet-amount {
  font-weight: 700;
  font-size: 16px;
}

.bet-result {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-win {
  font-size: 18px;
  font-weight: 700;
  color: var(--green);
}

.result-loss {
  font-size: 18px;
  font-weight: 700;
  color: var(--red);
}

.result-pending {
  font-size: 14px;
  color: var(--gold);
}

.result-icon {
  font-size: 20px;
}

.no-history {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.load-more {
  width: 100%;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .history-tabs {
    flex-direction: column;
  }
  
  .history-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .bet-result {
    width: 100%;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
