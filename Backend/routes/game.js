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
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить статистику пользователя
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const recentBets = await Bet.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      user,
      recentBets,
      stats: {
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        winRate: user.totalBets > 0 ? ((user.totalWins / user.totalBets) * 100).toFixed(1) : 0,
        totalWagered: user.totalWagered,
        totalWon: user.totalWon,
        profit: user.totalWon - user.totalWagered
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
