import express from 'express';
import Bet from '../models/Bet.js';
import Round from '../models/Round.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Получить историю ставок пользователя
router.get('/my-bets', protect, async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить историю раундов
router.get('/rounds-history', async (req, res) => {
  try {
    const rounds = await Round.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(rounds);
  } catch (error) {
    res.status(500
