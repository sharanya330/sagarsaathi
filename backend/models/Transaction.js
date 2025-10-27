import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  type: { type: String, enum: ['LEAD_FEE'], default: 'LEAD_FEE' },
  paidAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', TransactionSchema);
