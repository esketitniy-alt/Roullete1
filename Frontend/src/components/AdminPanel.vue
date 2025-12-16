<template>
  <div class="modal-overlay" @click.self="store.showAdmin = false">
    <div class="modal modal-large">
      <button class="modal-close" @click="store.showAdmin = false">✕</button>
      
      <h2>⚙️ Админ-панель</h2>
      
      <!-- Навигация -->
      <div class="admin-tabs">
        <button :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
          📊 Статистика
        </button>
        <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          👥 Пользователи
        </button>
      </div>
      
      <!-- Статистика платформы -->
      <div v-if="activeTab === 'stats'" class="admin-section">
        <div class="platform-stats" v-if="platformStats">
          <div class="stat-card">
            <span class="stat-icon">👥</span>
            <span class="stat-value">{{ platformStats.totalUsers }}</span>
            <span class="stat-label">Всего пользователей</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🟢</span>
            <span class="stat-value">{{ platformStats.activeUsers24h }}</span>
            <span class="stat-label">Активных за 24ч</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⚡</span>
            <span class="stat-value">{{ platformStats.activeUsers1h }}</span>
            <span class="stat-label">Активных за 1ч</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🎰</span>
            <span class="stat-value">{{ platformStats.totalRounds }}</span>
            <span class="stat-label">Всего раундов</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🎲</span>
            <span class="stat-value">{{ platformStats.totalBets }}</span>
            <span class="stat-label">Всего ставок</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ platformStats.totalWagered?.toLocaleString() }} 🪙</span>
            <span class="stat-label">Поставлено всего</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💸</span>
            <span class="stat-value">{{ platformStats.totalPayout?.toLocaleString() }} 🪙</span>
            <span class="stat-label">Выплачено всего</span>
          </div>
          <div class="stat-card" :class="{ profit: platformStats.profit >= 0, loss: platformStats.profit < 0 }">
            <span class="stat-icon">📈</span>
            <span class="stat-value">
              {{ platformStats.profit >= 0 ? '+' : '' }}{{ platformStats.profit?.toLocaleString() }} 🪙
            </span>
            <span class="stat-label">Профит платформы</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🏦</span>
            <span class="stat-value">{{ platformStats.totalUserBalance?.toLocaleString() }} 🪙</span>
            <span class="stat-label">Балансы пользователей</span>
          </div>
        </div>
        
        <button class="btn btn-secondary refresh-btn" @click="loadPlatformStats">
          🔄 Обновить статистику
        </button>
      </div>
      
      <!-- Пользователи -->
      <div v-if="activeTab === 'users'" class="admin-section">
        <div class="search-bar">
          <input 
            type="text" 
            v-model="searchQuery" 
            class="input"
            placeholder="🔍 Поиск по имени пользователя..."
            @input="debouncedSearch"
          />
        </div>
        
        <div class="users-list" v-if="users.length > 0">
          <div 
            v-for="user in users" 
            :key="user._id"
            class="user-card"
            :class="{ admin: user.isAdmin }"
          >
            <div class="user-main">
              <div class="user-avatar">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div class="user-info">
                <div class="user-name">
                  {{ user.username }}
                  <span v-if="user.isAdmin" class="admin-tag">👑 Админ</span>
                </div>
                <div class="user-meta">
                  <span>📅 {{ formatDate(user.createdAt) }}</span>
                  <span>🕐 {{ formatDate(user.lastActivity) }}</span>
                </div>
              </div>
            </div>
            
            <div class="user-stats">
              <div class="user-stat">
                <span class="stat-value">{{ user.balance?.toLocaleString() }} 🪙</span>
                <span class="stat-label">Баланс</span>
              </div>
              <div class="user-stat">
                <span class="stat-value">{{ user.totalBets || 0 }}</span>
                <span class="stat-label">Ставок</span>
              </div>
              <div class="user-stat">
                <span class="stat-value">{{ user.totalWins || 0 }}</span>
                <span class="stat-label">Побед</span>
              </div>
            </div>
            
            <div class="user-actions">
              <button class="action-btn add" @click="openBalanceModal(user, 'add')" title="Пополнить">
                ➕
              </button>
              <button class="action-btn subtract" @click="openBalanceModal(user, 'subtract')" title="Списать">
                ➖
              </button>
              <button class="action-btn set" @click="openBalanceModal(user, 'set')" title="Установить">
                ✏️
              </button>
              <button 
                class="action-btn admin-toggle" 
                @click="toggleAdmin(user)"
                :title="user.isAdmin ? 'Снять админа' : 'Сделать админом'"
                :disabled="user._id === store.user?._id"
              >
                {{ user.isAdmin ? '👤' : '👑' }}
              </button>
              <button class="action-btn view" @click="viewUserBets(user)" title="История ставок">
                📜
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="no-users">
          <p>Пользователи не найдены</p>
        </div>
        
        <div class="pagination" v-if="totalPages > 1">
          <button 
            class="btn btn-secondary"
            :disabled="currentPage === 1"
            @click="loadUsers(currentPage - 1)"
          >
            ← Назад
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            class="btn btn-secondary"
            :disabled="currentPage === totalPages"
            @click="loadUsers(currentPage + 1)"
          >
            Вперед →
          </button>
        </div>
      </div>
      
      <!-- Модальное окно баланса -->
      <div v-if="balanceModal.show" class="balance-modal-overlay" @click.self="closeBalanceModal">
        <div class="balance-modal">
          <h3>
            {{ balanceModal.action === 'add' ? '➕ Пополнить баланс' : 
               balanceModal.action === 'subtract' ? '➖ Списать баланс' : 
               '✏️ Установить баланс' }}
          </h3>
          <p class="modal-user">Пользователь: <strong>{{ balanceModal.user?.username }}</strong></p>
          <p class="modal-balance">Текущий баланс: <strong>{{ balanceModal.user?.balance?.toLocaleString() }} 🪙</strong></p>
          
          <div class="form-group">
            <label>Сумма:</label>
            <input 
              type="number" 
              v-model.number="balanceModal.amount" 
              class="input"
              min="0"
              placeholder="Введите сумму"
            />
          </div>
          
          <div class="quick-amounts">
            <button @click="balanceModal.amount = 100">100</button>
            <button @click="balanceModal.amount = 500">500</button>
            <button @click="balanceModal.amount = 1000">1000</button>
            <button @click="balanceModal.amount = 5000">5000</button>
            <button @click="balanceModal.amount = 10000">10000</button>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeBalanceModal">Отмена</button>
            <button 
              class="btn btn-primary" 
              @click="executeBalanceAction"
              :disabled="!balanceModal.amount || balanceModal.amount < 0 || balanceModal.loading"
            >
              {{ balanceModal.loading ? '⏳...' : 'Подтвердить' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Модальное окно истории ставок пользователя -->
      <div v-if="userBetsModal.show" class="balance-modal-overlay" @click.self="closeUserBetsModal">
        <div class="balance-modal user-bets-modal">
          <h3>📜 История ставок: {{ userBetsModal.user?.username }}</h3>
          
          <div class="user-bets-list" v-if="userBetsModal.bets.length > 0">
            <div 
              v-for="bet in userBetsModal.bets" 
              :key="bet._id"
              class="bet-item"
              :class="{ won: bet.won === true, lost: bet.won === false }"
            >
              <div class="bet-info">
                <span class="bet-round">Раунд #{{ bet.roundId }}</span>
                <span class="bet-date">{{ formatDate(bet.createdAt) }}</span>
              </div>
              <div class="bet-details">
                <span class="bet-color" :class="bet.color">
                  {{ bet.color === 'red' ? '🔴' : bet.color === 'green' ? '🟢' : '⚫' }}
                </span>
                <span class="bet-amount">{{ bet.amount }} 🪙</span>
                <span v-if="bet.won === true" class="bet-result win">+{{ bet.payout }} 🪙</span>
                <span v-else-if="bet.won === false" class="bet-result loss">-{{ bet.amount }} 🪙</span>
                <span v-else class="bet-result pending">⏳</span>
              </div>
            </div>
          </div>
          
          <div v-else class="no-bets">
            <p>У пользователя нет ставок</p>
          </div>
          
          <button class="btn btn-secondary close-btn" @click="closeUserBetsModal">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import axios from 'axios';

const store = useGameStore();
const API_URL = 'http://localhost:3000';

const activeTab = ref('stats');
const platformStats = ref(null);
const users = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

const balanceModal = ref({
  show: false,
  user: null,
  action: 'add',
  amount: 0,
  loading: false
});

const userBetsModal = ref({
  show: false,
  user: null,
  bets: []
});

let searchTimeout = null;

const formatDate = (date) => {
  if (!date) return 'Никогда';
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${store.token}` }
});

const loadPlatformStats = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/api/admin/stats`, getAuthHeaders());
    platformStats.value = data;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    store.showNotification('Ошибка загрузки статистики', 'error');
  }
};

const loadUsers = async (page = 1) => {
  try {
    const { data } = await axios.get(
      `${API_URL}/api/admin/users?page=${page}&limit=20&search=${searchQuery.value}`,
      getAuthHeaders()
    );
    users.value = data.users;
    currentPage.value = data.page;
    totalPages.value = data.pages;
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    store.showNotification('Ошибка загрузки пользователей', 'error');
  }
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadUsers(1);
  }, 300);
};

const openBalanceModal = (user, action) => {
  balanceModal.value = {
    show: true,
    user,
    action,
    amount: action === 'set' ? user.balance : 0,
    loading: false
  };
};

const closeBalanceModal = () => {
  balanceModal.value.show = false;
};

const executeBalanceAction = async () => {
  const { user, action, amount } = balanceModal.value;
  
  if (amount < 0 || (action !== 'set' && amount === 0)) {
    store.showNotification('Введите корректную сумму', 'error');
    return;
  }
  
  balanceModal.value.loading = true;
  
  try {
    let endpoint = '';
    switch (action) {
      case 'add':
        endpoint = '/api/admin/add-balance';
        break;
      case 'subtract':
        endpoint = '/api/admin/subtract-balance';
        break;
      case 'set':
        endpoint = '/api/admin/set-balance';
        break;
    }
    
    const { data } = await axios.post(
      `${API_URL}${endpoint}`,
      { userId: user._id, amount },
      getAuthHeaders()
    );
    
    store.showNotification(data.message, 'success');
    
    // Обновляем пользователя в списке
    const userIndex = users.value.findIndex(u => u._id === user._id);
    if (userIndex !== -1) {
      users.value[userIndex].balance = data.newBalance;
    }
    
    closeBalanceModal();
  } catch (error) {
    store.showNotification(error.response?.data?.message || 'Ошибка', 'error');
  } finally {
    balanceModal.value.loading = false;
  }
};

const toggleAdmin = async (user) => {
  if (user._id === store.user?._id) {
    store.showNotification('Нельзя изменить свой статус', 'error');
    return;
  }
  
  try {
    const { data } = await axios.post(
      `${API_URL}/api/admin/toggle-admin`,
      { userId: user._id },
      getAuthHeaders()
    );
    
    store.showNotification(data.message, 'success');
    
    // Обновляем пользователя в списке
    const userIndex = users.value.findIndex(u => u._id === user._id);
    if (userIndex !== -1) {
      users.value[userIndex].isAdmin = data.user.isAdmin;
    }
  } catch (error) {
    store.showNotification(error.response?.data?.message || 'Ошибка', 'error');
  }
};

const viewUserBets = async (user) => {
  try {
    const { data } = await axios.get(
      `${API_URL}/api/admin/user-bets/${user._id}?limit=50`,
      getAuthHeaders()
    );
    
    userBetsModal.value = {
      show: true,
      user,
      bets: data.bets
    };
  } catch (error) {
    store.showNotification('Ошибка загрузки ставок', 'error');
  }
};

const closeUserBetsModal = () => {
  userBetsModal.value.show = false;
};

onMounted(() => {
  loadPlatformStats();
  loadUsers();
});
</script>

<style scoped>
.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.admin-tabs button {
  flex: 1;
  padding: 14px 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  border-radius: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.admin-tabs button:hover {
  background: rgba(0, 0, 0, 0.3);
}

.admin-tabs button.active {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
}

.admin-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.platform-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.platform-stats .stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.platform-stats .stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.platform-stats .stat-card.profit {
  border-color: var(--green);
  background: rgba(0, 210, 106, 0.1);
}

.platform-stats .stat-card.loss {
  border-color: var(--red);
  background: rgba(233, 69, 96, 0.1);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.platform-stats .stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.platform-stats .stat-card.profit .stat-value {
  color: var(--green);
}

.platform-stats .stat-card.loss .stat-value {
  color: var(--red);
}

.platform-stats .stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
}

.refresh-btn {
  width: 100%;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar .input {
  font-size: 16px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.user-card:hover {
  background: rgba(0, 0, 0, 0.3);
}

.user-card.admin {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.05);
}

.user-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent) 0%, #9d4edd 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-card.admin .user-avatar {
  background: linear-gradient(135deg, var(--gold) 0%, #ffed4a 100%);
  color: #1a1a2e;
}

.user-info {
  min-width: 0;
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--gold);
  color: #1a1a2e;
  border-radius: 10px;
  font-weight: 700;
}

.user-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  flex-wrap: wrap;
}

.user-stats {
  display: flex;
  gap: 20px;
}

.user-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.user-stat .stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--gold);
}

.user-stat .stat-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.add {
  background: rgba(0, 210, 106, 0.2);
  color: var(--green);
}

.action-btn.add:hover:not(:disabled) {
  background: var(--green);
  color: #1a1a2e;
}

.action-btn.subtract {
  background: rgba(233, 69, 96, 0.2);
  color: var(--red);
}

.action-btn.subtract:hover:not(:disabled) {
  background: var(--red);
  color: white;
}

.action-btn.set {
  background: rgba(123, 44, 191, 0.2);
  color: var(--accent);
}

.action-btn.set:hover:not(:disabled) {
  background: var(--accent);
  color: white;
}

.action-btn.admin-toggle {
  background: rgba(255, 215, 0, 0.2);
  color: var(--gold);
}

.action-btn.admin-toggle:hover:not(:disabled) {
  background: var(--gold);
  color: #1a1a2e;
}

.action-btn.view {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.action-btn.view:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.no-users {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-info {
  color: var(--text-secondary);
  font-weight: 600;
}

/* Модальное окно баланса */
.balance-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.balance-modal {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  animation: modalIn 0.3s ease;
}

.balance-modal h3 {
  margin-bottom: 16px;
  text-align: center;
}

.modal-user, .modal-balance {
  text-align: center;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.modal-user strong, .modal-balance strong {
  color: var(--text-primary);
}

.balance-modal .form-group {
  margin: 20px 0;
}

.balance-modal .form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.quick-amounts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.quick-amounts button {
  flex: 1;
  min-width: 60px;
  padding: 8px;
  background: var(--bg-secondary);
  border: 1px solid #333;
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-amounts button:hover {
  border-color: var(--accent);
  background: rgba(123, 44, 191, 0.2);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-actions .btn {
  flex: 1;
}

/* Модальное окно ставок пользователя */
.user-bets-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.user-bets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  margin: 20px 0;
}

.user-bets-list .bet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid transparent;
}

.user-bets-list .bet-item.won {
  border-left-color: var(--green);
}

.user-bets-list .bet-item.lost {
  border-left-color: var(--red);
}

.user-bets-list .bet-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-bets-list .bet-round {
  font-weight: 600;
  font-size: 14px;
}

.user-bets-list .bet-date {
  font-size: 11px;
  color: var(--text-secondary);
}

.user-bets-list .bet-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-bets-list .bet-color {
  font-size: 18px;
}

.user-bets-list .bet-amount {
  font-weight: 600;
}

.user-bets-list .bet-result {
  font-weight: 700;
}

.user-bets-list .bet-result.win {
  color: var(--green);
}

.user-bets-list .bet-result.loss {
  color: var(--red);
}

.user-bets-list .bet-result.pending {
  color: var(--gold);
}

.no-bets {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.close-btn {
  width: 100%;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .platform-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-stats {
    width: 100%;
    justify-content: space-around;
    padding: 12px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .user-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
