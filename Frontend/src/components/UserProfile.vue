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
          <span class="stat-
