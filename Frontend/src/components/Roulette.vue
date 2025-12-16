<template>
  <div class="roulette-container">
    <!-- Стрелка-указатель -->
    <div class="pointer">▼</div>
    
    <!-- Колесо рулетки -->
    <div class="wheel-wrapper">
      <div 
        class="wheel" 
        :style="wheelStyle"
      >
        <div 
          v-for="(sector, index) in sectors" 
          :key="index"
          class="sector"
          :class="sector.color"
          :style="getSectorStyle(index)"
        >
          <span class="sector-number">{{ sector.number }}</span>
        </div>
      </div>
      
      <!-- Центр колеса -->
      <div class="wheel-center">
        <template v-if="store.gamePhase === 'spinning'">
          <div class="spinning-icon">🎰</div>
        </template>
        <template v-else-if="lastResult !== null">
          <span class="last-result" :class="lastResultColor">
            {{ lastResult }}
          </span>
        </template>
        <template v-else>
          <span class="waiting-icon">🎲</span>
        </template>
      </div>
    </div>
    
    <!-- Информация о последнем результате -->
    <div v-if="lastResultColor && store.gamePhase !== 'spinning'" class="result-info">
      <span class="result-text">
        Выпало: 
        <span :class="'color-' + lastResultColor">
          {{ lastResultColor === 'red' ? '🔴 Красное' : lastResultColor === 'green' ? '🟢 Зеленое' : '⚫ Черное' }}
        </span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();

const rotation = ref(0);
const lastResult = ref(null);
const lastResultColor = ref('');
const isAnimating = ref(false);

const defaultSectors = [
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

const sectors = computed(() => {
  return store.sectors.length > 0 ? store.sectors : defaultSectors;
});

const wheelStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg)`,
  transition: isAnimating.value ? 'transform 8s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
}));

const getSectorStyle = (index) => {
  const totalSectors = sectors.value.length;
  const angle = 360 / totalSectors;
  const rotate = angle * index - 90;
  const skew = 90 - angle;
  
  return {
    transform: `rotate(${rotate}deg) skewY(${skew}deg)`,
  };
};

watch(() => store.isSpinning, (spinning) => {
  if (spinning && store.winningSectorIndex !== null) {
    spinWheel(store.winningSectorIndex);
  }
});

watch(() => store.lastResults, (results) => {
  if (results && results.length > 0) {
    lastResult.value = results[0].sector;
    lastResultColor.value = results[0].color;
  }
}, { deep: true, immediate: true });

watch(() => store.gamePhase, (phase) => {
  if (phase === 'betting') {
    isAnimating.value = false;
  }
});

const spinWheel = (winningSectorIndex) => {
  const totalSectors = sectors.value.length;
  const sectorAngle = 360 / totalSectors;
  
  const fullRotations = 5 + Math.floor(Math.random() * 3);
  const targetAngle = 360 - (winningSectorIndex * sectorAngle) - (sectorAngle / 2);
  const randomOffset = (Math.random() - 0.5) * (sectorAngle * 0.6);
  
  isAnimating.value = false;
  rotation.value = rotation.value % 360;
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isAnimating.value = true;
      rotation.value = rotation.value + (fullRotations * 360) + targetAngle + randomOffset;
    });
  });
};
</script>

<style scoped>
.roulette-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.pointer {
  font-size: 48px;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  z-index: 10;
  margin-bottom: -15px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  animation: pointerPulse 1s ease infinite;
}

@keyframes pointerPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.wheel-wrapper {
  position: relative;
  width: 350px;
  height: 350px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background: var(--bg-card);
  box-shadow: 
    0 0 0 8px var(--bg-secondary),
    0 0 0 12px var(--gold),
    0 0 0 16px var(--bg-secondary),
    0 0 60px rgba(255, 215, 0, 0.3),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.sector {
  position: absolute;
  width: 50%;
  height: 50%;
  left: 50%;
  top: 50%;
  transform-origin: 0 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 15px;
}

.sector.red {
  background: linear-gradient(to right, #c0392b 0%, #e74c3c 50%, #c0392b 100%);
}

.sector.black {
  background: linear-gradient(to right, #1a1a2e 0%, #2d3436 50%, #1a1a2e 100%);
}

.sector.green {
  background: linear-gradient(to right, #27ae60 0%, #2ecc71 50%, #27ae60 100%);
}

.sector-number {
  font-size: 14px;
  font-weight: 700;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  transform: skewY(78deg) rotate(12deg);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 
    0 0 20px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  border: 4px solid var(--gold);
  z-index: 5;
}

.spinning-icon {
  animation: spin 0.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.last-result {
  font-size: 36px;
  font-weight: 900;
}

.last-result.red { color: var(--red); }
.last-result.black { color: #888; }
.last-result.green { color: var(--green); }

.waiting-icon {
  font-size: 36px;
}

.result-info {
  margin-top: 20px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
}

.result-text {
  color: var(--text-secondary);
}

.color-red { color: var(--red); }
.color-black { color: var(--text-primary); }
.color-green { color: var(--green); }

@media (max-width: 480px) {
  .wheel-wrapper {
    width: 280px;
    height: 280px;
  }
  
  .wheel-center {
    width: 70px;
    height: 70px;
  }
  
  .last-result {
    font-size: 28px;
  }
  
  .pointer {
    font-size: 36px;
  }
}
</style>
