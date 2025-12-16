<template>
  <div class="current-bets">
    <h3 class="section-title">📊 Ставки в раунде #{{ store.currentRoundId }}</h3>
    
    <div class="bets-summary">
      <div class="summary-item red">
        <span class="color-label">🔴 Красное</span>
        <span class="bets-count">{{ redBets.length }} ставок</span>
        <span class="bets-total">{{ redTotal.toLocaleString() }} 🪙</span>
      </div>
      
      <div class="summary-item green">
        <span class="color-label">🟢 Зеленое</span>
        <span class="bets-count">{{ greenBets.length }} ставок</span>
        <span class="bets-total">{{ greenTotal.toLocaleString() }} 🪙</span>
      </div>
      
      <div class="summary-item black">
        <span class="color-label">⚫ Черное</span>
        <span class="bets-count">{{ blackBets.length }} ставок</span>
        <span class="bets-total">{{ blackTotal.toLocaleString() }} 🪙</span>
      </div>
    </div>
    
    <div class="bets-list" v-if="store.currentBets.length > 0">
      <div class="bets-columns">
        <!-- Красные ставки -->
        <div class="bets-column">
          <h4 class="column-title red">🔴 Красное</h4>
          <div class="column-bets">
            <div 
              v-for="(bet, index) in redBets" 
              :key="'red-' + index"
              class="bet-item red"
            >
              <span class="bet-user">{{ bet.username }}</span>
              <span class="bet-amount">{{ bet.amount }} 🪙</span>
            </div>
            <div v-if="redBets.length === 0" class="no-bets">
              Нет ставок
            </div>
          </div>
        </div>
        
        <!-- Зеленые ставки -->
        <div class="bets-column">
          <h4 class="column-title green">🟢 Зеленое</h4>
          <div class="column-bets">
            <div 
              v-for="(bet, index) in greenBets" 
              :key="'green-' + index"
              class="bet-item green"
            >
              <span class="bet-user">{{ bet.username }}</span>
              <span class="bet-amount">{{ bet.amount }} 🪙</span>
            </div>
            <div v-if="greenBets.length === 0" class="no-bets">
              Нет ставок
            </div>
          </div>
        </div>
        
        <!-- Черные ставки -->
        <div class="bets-column">
          <h4 class="column-title black">⚫ Черное</h4>
          <div class="column-bets">
            <div 
              v-for="(bet, index) in blackBets" 
              :key="'black-' + index"
              class="bet-item black"
            >
              <span class="bet-user">{{ bet.username }}</span>
              <span class="bet-amount">{{ bet.amount }} 🪙</span>
            </div>
            <div v-if="blackBets.length === 0" class="no-bets">
              Нет ставок
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-bets-message">
      <p>🎲 Пока нет ставок в этом раунде</p>
      <p class="hint">Будьте первым!</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();

const redBets = computed(() => store.currentBets.filter(b => b.color === 'red'));
const greenBets = computed(() => store.currentBets.filter(b => b.color === 'green'));
const blackBets = computed(() => store.currentBets.filter(b => b.color === 'black'));

const redTotal = computed(() => redBets.value.reduce((sum, b) => sum + b.amount, 0));
const greenTotal = computed(() => greenBets.value.reduce((sum, b) => sum + b.amount, 0));
const blackTotal = computed(() => blackBets.value.reduce((sum, b) => sum + b.amount, 0));
</script>

<style scoped>
.current-bets {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 900px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.section-title {
  text-align: center;
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.bets-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.summary-item.red {
  border-left: 4px solid var(--red);
}

.summary-item.green {
  border-left: 4px solid var(--green);
}

.summary-item.black {
  border-left: 4px solid #555;
}

.color-label {
  font-weight: 600;
  font-size: 14px;
}

.bets-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.bets-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--gold);
}

.bets-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.bets-column {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.column-title {
  padding: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.column-title.red {
  background: rgba(233, 69, 96, 0.3);
}

.column-title.green {
  background: rgba(0, 210, 106, 0.3);
}

.column-title.black {
  background: rgba(45, 45, 45, 0.5);
}

.column-bets {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.bet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  font-size: 13px;
}

.bet-item.red {
  background: rgba(233, 69, 96, 0.15);
}

.bet-item.green {
  background: rgba(0, 210, 106, 0.15);
}

.bet-item.black {
  background: rgba(45, 45, 45, 0.3);
}

.bet-user {
  font-weight: 500;
  color: var(--text-primary);
}

.bet-amount {
  font-weight: 600;
  color: var(--gold);
}

.no-bets {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 13px;
}

.no-bets-message {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.no-bets-message .hint {
  font-size: 14px;
  margin-top: 8px;
  color: var(--accent);
}

@media (max-width: 768px) {
  .bets-summary,
  .bets-columns {
    grid-template-columns: 1fr;
  }
}
</style>
