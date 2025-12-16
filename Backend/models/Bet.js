import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  roundId: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    enum: ['red', 'black', 'green'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  won: {
    type: Boolean,
    default: null
  },
  payout: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Bet', betSchema);
