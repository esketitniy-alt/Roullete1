<template>
  <div class="roulette-container">
    <!-- Стрелка-указатель -->
    <div class="pointer">▼</div>
    
    <!-- Колесо рулетки -->
    <div class="wheel-wrapper">
      <div 
        class="wheel" 
        :style="wheelStyle"
        :class="{ spinning: store.isSpinning }"
      >
        <div 
          v-for="(sector, index) in store.sectors" 
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
        <span v-if="lastResult !== null" class="last-result" :class="lastResultColor">
          {{ lastResult }}
        </span>
        <span v-else>🎰</span>
      </div>
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

const wheelStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg)`
}));

const getSectorStyle = (index) => {
  const totalSectors = store.sectors.length || 15;
  const angle = 360 / totalSectors;
  const rotate = angle * index;
  
  return {
    transform: `rotate(${rotate}deg)`,
    '--sector-angle': `${angle}deg`
  };
};

// Следим за началом кручения
watch(() => store.isSpinning, (spinning) => {
  if (spinning && store.winningSectorIndex !== null) {
    spinWheel(store.winningSectorIndex);
  }
});

// Следим за результатом
watch(() => store.lastResults, (results) => {
  if (results.length > 0) {
    lastResult.value = results[0].sector;
    lastResultColor.value = results[0].color;
  }
}, { deep: true });

const spinWheel = (winningSectorIndex) => {
  const totalSectors = store.sectors.length || 15;
  const sectorAngle = 360 / totalSectors;
  
  // Рассчитываем угол для остановки на нужном секторе
  // Добавляем несколько полных оборотов для эффекта
  const fullRotations = 5 + Math.floor(Math.random() * 3); // 5-7 полных оборотов
  const targetAngle = 360 - (winningSectorIndex * sectorAngle) - (sectorAngle / 2);
  
  rotation.value = rotation.value + (fullRotations * 360) + targetAngle + (Math.random() * 10 - 5);
};
</script>

<style scoped>
.roulette-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pointer {
  font-size: 48px;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  z-index: 10;
  margin-bottom: -20px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.wheel-wrapper {
  position: relative;
  width: 400px;
  height: 400px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background: var(--bg-card);
  box-shadow: 
    0 0 0 10px var(--bg-secondary),
    0 0 0 15px var(--gold),
    0 0 50px rgba(255, 215, 0, 0.3);
  transition: transform 8s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  overflow: hidden;
}

.wheel.spinning {
  /* Анимация применяется через transform в стилях */
}

.sector {
  position: absolute;
  width: 50%;
  height: 50%;
  left: 50%;
  top: 0;
  transform-origin: 0% 100%;
  clip-path: polygon(0 100%, 100% 0, 0 0);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20px;
}

.sector.red {
  background: linear-gradient(135deg, var(--red) 0%, #ff6b6b 100%);
}

.sector.black {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d2d2d 100%);
}

.sector.green {
  background: linear-gradient(135deg, var(--green) 0%, #00ff88 100%);
}

.sector-number {
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  transform: rotate(calc(var(--sector-angle) / 2 - 90deg));
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
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

.last-result {
  font-size: 36px;
  font-weight: 900;
}

.last-result.red {
  color: var(--red);
}

.last-result.black {
  color: #888;
}

.last-result.green {
  color: var(--green);
}

@media (max-width: 480px) {
  .wheel-wrapper {
    width: 300px;
    height: 300px;
  }
  
  .wheel-center {
    width: 70px;
    height: 70px;
    font-size: 24px;
  }
  
  .last-result {
    font-size: 28px;
  }
  
  .pointer {
    font-size: 36px;
  }
}
</style>
