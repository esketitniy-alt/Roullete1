import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  roundId: {
    type: Number,
    required: true,
    unique: true
  },
  result: {
    sector: Number,
    color: String
  },
  totalBets: {
    type: Number,
    default: 0
  },
  totalPayout: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['betting', 'spinning', 'completed'],
    default: 'betting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

export default mongoose.model('Round', roundSchema);
