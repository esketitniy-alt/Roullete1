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
            placeholder="Введите логин"
            minlength="3"
            maxlength="20"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input 
            type="password" 
            v-model="password" 
            class="input"
            placeholder="Введите пароль"
            minlength="6"
            required
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
          />
        </div>
        
        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? '⏳ Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться') }}
        </button>
      </form>
      
      <div class="auth-switch">
        <template v-if="isLogin">
          Нет аккаунта? 
          <button @click="isLogin = false" class="link-btn">Зарегистрироваться</button>
        </template>
        <template v-else>
          Уже есть аккаунт? 
          <button @click="isLogin = true" class="link-btn">Войти</button>
        </template>
      </div>
      
      <div v-if="!isLogin" class="bonus-info">
        🎁 При
