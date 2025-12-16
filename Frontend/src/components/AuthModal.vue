<template>
  <div class="modal-overlay" @click.self="store.showAuth = false">
    <div class="modal">
      <button class="modal-close" @click="store.showAuth = false">✕</button>
      
      <h2>{{ isLogin ? '🔐 Вход' : '📝 Регистрация' }}</h2>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label>Логин</label>
          <input 
            type="text" 
            v-model="username" 
            class="input"
            placeholder="Введите логин (3-20 символов)"
            minlength="3"
            maxlength="20"
            required
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input 
            type="password" 
            v-model="password" 
            class="input"
            placeholder="Введите пароль (мин. 6 символов)"
            minlength="6"
            required
            autocomplete="current-password"
          />
        </div>
        
        <div v-if="!isLogin" class="form-group">
          <label>Подтвердите пароль</label>
          <input 
            type="password" 
            v-model="confirmPassword" 
            class="input"
            placeholder="Повторите пароль"
            required
            autocomplete="new-password"
          />
        </div>
        
        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading">⏳ Загрузка...</span>
          <span v-else>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</span>
        </button>
      </form>
      
      <div class="auth-switch">
        <template v-if="isLogin">
          Нет аккаунта? 
          <button @click="switchMode" class="link-btn">Зарегистрироваться</button>
        </template>
        <template v-else>
          Уже есть аккаунт? 
          <button @click="switchMode" class="link-btn">Войти</button>
        </template>
      </div>
      
      <div v-if="!isLogin" class="bonus-info">
        🎁 При регистрации вы получите <strong>1000 монет</strong> бесплатно!
      </div>
      
      <div class="demo-credentials" v-if="isLogin">
        <p>Демо вход:</p>
        <button @click="fillDemo" class="demo-btn">admin / admin123</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();

const isLogin = ref(true);
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const switchMode = () => {
  isLogin.value = !isLogin.value;
  error.value = '';
  password.value = '';
  confirmPassword.value = '';
};

const fillDemo = () => {
  username.value = 'admin';
  password.value = 'admin123';
};

const handleSubmit = async () => {
  error.value = '';
  
  // Валидация
  const trimmedUsername = username.value.trim();
  
  if (trimmedUsername.length < 3) {
    error.value = 'Логин должен быть минимум 3 символа';
    return;
  }
  
  if (trimmedUsername.length > 20) {
    error.value = 'Логин должен быть максимум 20 символов';
    return;
  }
  
  if (password.value.length < 6) {
    error.value = 'Пароль должен быть минимум 6 символов';
    return;
  }
  
  if (!isLogin.value) {
    if (password.value !== confirmPassword.value) {
      error.value = 'Пароли не совпадают';
      return;
    }
  }
  
  loading.value = true;
  
  try {
    let result;
    
    if (isLogin.value) {
      result = await store.login(trimmedUsername, password.value);
    } else {
      result = await store.register(trimmedUsername, password.value);
    }
    
    if (!result.success) {
      error.value = result.message;
    }
  } catch (e) {
    error.value = 'Произошла ошибка. Попробуйте позже.';
    console.error('Auth error:', e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
}

.btn-full {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  margin-top: 8px;
}

.error-message {
  background: rgba(233, 69, 96, 0.2);
  border: 1px solid var(--error);
  color: var(--error);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.auth-switch {
  text-align: center;
  margin-top: 24px;
  color: var(--text-secondary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  font-size: 16px;
}

.link-btn:hover {
  color: #9d4edd;
}

.bonus-info {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 237, 74, 0.05) 100%);
  border: 2px solid var(--gold);
  border-radius: 12px;
  text-align: center;
  color: var(--gold);
  font-size: 14px;
}

.bonus-info strong {
  font-size: 18px;
}

.demo-credentials {
  margin-top: 20px;
  padding: 16px;
  background: rgba(123, 44, 191, 0.1);
  border: 1px dashed var(--accent);
  border-radius: 12px;
  text-align: center;
}

.demo-credentials p {
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.demo-btn {
  background: var(--accent);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.demo-btn:hover {
  background: #9d4edd;
  transform: translateY(-2px);
}
</style>
