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
            ## ALL
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
            {{ bet.color === 'red' ? '
