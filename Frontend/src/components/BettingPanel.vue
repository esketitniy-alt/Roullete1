<template>
  <div class="betting-panel">
    <h3 class="panel-title">💰 Сделать ставку</h3>
    
    <!-- Информация о ставках -->
    <div class="bet-info">
      <span>Мин: {{ store.minBet }} 🪙</span>
      <span>Макс: {{ store.maxBet.toLocaleString() }} 🪙</span>
    </div>
    
    <!-- Ввод суммы -->
    <div class="bet-amount-section">
      <label class="input-label">Сумма ставки:</label>
      <div class="amount-input-wrapper">
        <input 
          type="number" 
          v-model.number="betAmount" 
          class="input amount-input"
          :min="store.minBet"
          :max="store.maxBet"
          :disabled="!store.canBet"
          placeholder="Введите сумму"
        />
        <div class="quick-amounts">
          <button 
            v-for="amount in quickAmounts" 
            :key="amount"
            class="quick-btn"
            @click="betAmount = amount"
            :disabled="!store.canBet"
          >
            {{ amount }}
          </button>
          <button 
            class="quick-btn"
            @click="betAmount = Math.floor(store.user?.balance / 2) || 0"
            :disabled="!store.canBet"
          >
            1/2
          </button>
          <button 
            class="quick-btn"
            @click="betAmount = store.user?.balance || 0"
            :disabled="!store.canBet"
          >
            ALL
          </button>
        </div>
      </div>
    </div>
    
    <!-- Кнопки ставок на цвета -->
    <div class="color-buttons">
      <button 
        class="color-btn red"
        :class="{ selected: selectedColors.includes('red'), disabled: isColorDisabled('red') }"
        @click="placeBet('red')"
        :disabled="!store.canBet || isColorDisabled('red')"
      >
        <span class="color-name">🔴 Красное</span>
        <span class="multiplier">x{{ store.multipliers.red }}</span>
        <span class="total-bets">{{ getTotalBets('red') }} 🪙</span>
      </button>
      
      <button 
        class="color-btn green"
        :class="{ selected: selectedColors.includes('green'), disabled: isColorDisabled('green') }"
        @click="placeBet('green')"
        :disabled="!store.canBet || isColorDisabled('green')"
      >
        <span class="color-name">🟢 Зеленое</span>
        <span class="multiplier">x{{ store.multipliers.green }}</span>
        <span class="total-bets">{{ getTotalBets('green') }} 🪙</span>
      </button>
      
      <button 
        class="color-btn black"
        :class="{ selected: selectedColors.includes('black'), disabled: isColorDisabled('black') }"
        @click="placeBet('black')"
        :disabled="!store.canBet || isColorDisabled('black')"
      >
        <span class="color-name">⚫ Черное</span>
        <span class="multiplier">x{{ store.multipliers.black }}</span>
        <span class="total-bets">{{ getTotalBets('black') }} 🪙</span>
      </button>
    </div>
    
    <!-- Мои ставки в текущем раунде -->
    <div v-if="myCurrentBets.length > 0" class="my-bets">
      <h4>Мои ставки в этом раунде:</h4>
      <div class="my-bets-list">
        <div 
          v-for="(bet, index) in myCurrentBets" 
          :key="index"
          class="my-bet-item"
          :class="bet.color"
        >
          <span class="bet-color-icon">
            {{ bet.color === 'red' ? '🔴' : bet.color === 'green' ? '🟢' : '⚫' }}
          </span>
          <span class="bet-amount">{{ bet.amount }} 🪙</span>
          <span class="potential-win">
            Выигрыш: {{ bet.amount * store.multipliers[bet.color] }} 🪙
          </span>
        </div>
      </div>
      <div class="total-my-bets">
        Всего поставлено: {{ totalMyBets }} 🪙
      </div>
    </div>
    
    <!-- Предупреждение для неавторизованных -->
    <div v-if="!store.isAuthenticated" class="auth-warning">
      <p>🔒 Войдите в аккаунт, чтобы делать ставки</p>
      <button class="btn btn-primary" @click="store.showAuth = true">
        Войти / Регистрация
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();
const betAmount = ref(100);
const quickAmounts = [10, 50, 100, 500, 1000];

const myCurrentBets = computed(() => {
  if (!store.user) return [];
  return store.currentBets.filter(bet => bet.odId === store.user._id);
});

const selectedColors = computed(() => {
  return [...new Set(myCurrentBets.value.map(bet => bet.color))];
});

const totalMyBets = computed(() => {
  return myCurrentBets.value.reduce((sum, bet) => sum + bet.amount, 0);
});

const isColorDisabled = (color) => {
  if (selectedColors.value.includes(color)) return false;
  return selectedColors.value.length >= 2;
};

const getTotalBets = (color) => {
  return store.currentBets
    .filter(bet => bet.color === color)
    .reduce((sum, bet) => sum + bet.amount, 0);
};

const placeBet = (color) => {
  if (!betAmount.value || betAmount.value < store.minBet) {
    store.showNotification(`Минимальная ставка: ${store.minBet}`, 'error');
    return;
  }
  store.placeBet(color, betAmount.value);
};
</script>

<style scoped>
.betting-panel {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.panel-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--gold);
}

.bet-info {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin-bottom: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.bet-amount-section {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.amount-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.amount-input {
  font-size: 24px;
  text-align: center;
  font-weight: 700;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-btn {
  flex: 1;
  min-width: 60px;
  padding: 10px;
  background: var(--bg-secondary);
  border: 2px solid #333;
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(123, 44, 191, 0.2);
}

.quick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: 3px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.color-btn.red {
  background: linear-gradient(135deg, var(--red) 0%, #ff6b6b 100%);
}

.color-btn.green {
  background: linear-gradient(135deg, var(--green) 0%, #00ff88 100%);
}

.color-btn.black {
  background: linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 100%);
  border-color: #555;
}

.color-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.color-btn.selected {
  border-color: var(--gold);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.color-btn.disabled:not(.selected) {
  opacity: 0.4;
  cursor: not-allowed;
}

.color-btn:disabled {
  cursor: not-allowed;
}

.color-name {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.color-btn.green .color-name {
  color: #1a1a2e;
}

.multiplier {
  font-size: 24px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
}

.color-btn.green .multiplier {
  color: #1a1a2e;
}

.total-bets {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
}

.my-bets {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.my-bets h4 {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.my-bets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.my-bet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.my-bet-item.red {
  border-left: 4px solid var(--red);
}

.my-bet-item.green {
  border-left: 4px solid var(--green);
}

.my-bet-item.black {
  border-left: 4px solid #666;
}

.bet-color-icon {
  font-size: 20px;
}

.bet-amount {
  font-weight: 700;
  font-size: 16px;
}

.potential-win {
  margin-left: auto;
  color: var(--gold);
  font-size: 14px;
}

.total-my-bets {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: right;
  font-weight: 700;
  color: var(--gold);
}

.auth-warning {
  text-align: center;
  padding: 24px;
  background: rgba(233, 69, 96, 0.1);
  border: 2px solid var(--red);
  border-radius: 12px;
}

.auth-warning p {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

@media (max-width: 480px) {
  .color-buttons {
    grid-template-columns: 1fr;
  }
  
  .color-btn {
    flex-direction: row;
    justify-content: space-between;
    padding: 16px;
  }
}
</style>
