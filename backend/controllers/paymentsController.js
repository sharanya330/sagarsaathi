import { Trip } from '../models/Tripmodel.js';

let stripe = null;

export const createLeadFeeSession = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(501).json({ message: 'Stripe not configured' });
    if (!stripe) { const m = await import('stripe'); stripe = new m.default(process.env.STRIPE_SECRET_KEY); }
    const { tripId } = req.body || {};
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip' });
    if (trip.leadFeePaid) return res.json({ message: 'Already paid', paid: true });
    const amount = (trip.leadFeeAmount || Number(process.env.LEAD_FEE_AMOUNT || 99)) * 100; // to paise
    const successUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/driver/trips?paid=1&tripId=${trip._id}`;
    const cancelUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/driver/trips?paid=0&tripId=${trip._id}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price_data: { currency: 'inr', product_data: { name: 'Lead Fee' }, unit_amount: amount }, quantity: 1 }],
      metadata: { tripId: String(trip._id), driverId: String(req.user._id) }
    });
    return res.json({ url: session.url, id: session.id });
  } catch (e) {
    console.error('Stripe session error:', e);
    return res.status(500).json({ message: 'Failed to create session' });
  }
};

export const confirmLeadFee = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(501).json({ message: 'Stripe not configured' });
    if (!stripe) { const m = await import('stripe'); stripe = new m.default(process.env.STRIPE_SECRET_KEY); }
    const { session_id, tripId } = req.query || {};
    if (!session_id || !tripId) return res.status(400).json({ message: 'Missing params' });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      if (String(trip.driver) !== String(req.user._id)) return res.status(403).json({ message: 'Not assigned to this trip' });
      if (!trip.leadFeePaid) {
        trip.leadFeePaid = true;
        trip.leadFeePaidAt = new Date();
        await trip.save();
        try {
          const { Transaction } = await import('../models/Transaction.js');
          await Transaction.create({ trip: trip._id, driver: trip.driver, amount: trip.leadFeeAmount || 0, currency: 'INR', type: 'LEAD_FEE', paidAt: trip.leadFeePaidAt });
        } catch (e) { console.error('Txn log failed:', e?.message); }
      }
      return res.json({ paid: true });
    }
    return res.json({ paid: false });
  } catch (e) {
    console.error('Stripe confirm error:', e);
    return res.status(500).json({ message: 'Failed to confirm payment' });
  }
};