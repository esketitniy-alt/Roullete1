import express from 'express';
import User from '../models/User.js';
import Bet from '../models/Bet.js';
import Round from '../models/Round.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Получить всех пользователей
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить статистику платформы
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBets = await Bet.countDocuments();
    const totalRounds = await Round.countDocuments({ status: 'completed' });
    
    const aggregatedBets = await Bet.aggregate([
      {
        $group: {
          _id: null,
          totalWagered: { $sum: '$amount' },
          totalPayout: { $sum: '$payout' }
        }
      }
    ]);
    
    const activeUsers = await User.countDocuments({
      lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      totalUsers,
      activeUsers,
      totalBets,
      totalRounds,
      totalWagered: aggregatedBets[0]?.totalWagered || 0,
      totalPayout: aggregatedBets[0]?.totalPayout || 0,
      profit: (aggregatedBets[0]?.totalWagered || 0) - (aggregatedBets[0]?.totalPayout || 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Пополнить баланс пользователя
router.post('/add-balance', protect, adminOnly, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Неверные данные' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    user.balance += amount;
    await user.save();
    
    res.json({ message: 'Баланс пополнен', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Списать баланс пользователя
router.post('/subtract-balance', protect, adminOnly, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Неверные данные' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Недостаточно средств у пользователя' });
    }
    
    user.balance -= amount;
    await user.save();
    
    res.json({ message: 'Баланс списан', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить историю ставок пользователя (для админа)
router.get('/user-bets/:userId', protect, adminOnly, async (req, res) => {
  try {
    const bets = await Bet.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Сделать пользователя админом
router.post('/make-admin', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    user.isAdmin = true;
    await user.save();
    
    res.json({ message: 'Пользователь назначен администратором' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
