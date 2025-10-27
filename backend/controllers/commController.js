import { Trip } from '../models/Tripmodel.js';
import { makeMaskedCall } from '../services/twilio.js';

// Initiate a masked call between the requester and the counterparty for a trip
// Body: { tripId }
export const startMaskedCall = async (req, res) => {
  try{
    const { tripId } = req.body || {};
    if (!tripId) return res.status(400).json({ message: 'tripId required' });
    const trip = await Trip.findById(tripId).populate('user','phone').populate('driver','phone');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Only participants can initiate
    const me = req.user?._id;
    const isUser = String(trip.user?._id||'') === String(me||'');
    const isDriver = String(trip.driver||'') === String(me||'');
    if (!isUser && !isDriver) return res.status(403).json({ message: 'Not a participant' });

    // Optional: require lead fee paid before calls
    if (!trip.leadFeePaid) return res.status(402).json({ message: 'Lead fee not paid' });

    const userPhone = trip.user?.phone;
    const driverPhone = (await (await import('../models/Drivermodel.js')).Driver.findById(trip.driver).select('phone'))?.phone;
    if (!userPhone || !driverPhone) return res.status(400).json({ message: 'Missing party phone' });

    // Determine A (caller) and B (callee)
    const toA = isUser ? userPhone : driverPhone;
    const toB = isUser ? driverPhone : userPhone;

    const sid = await makeMaskedCall(toA, toB);
    return res.json({ callSid: sid });
  }catch(e){
    console.error('Masked call failed:', e?.message);
    return res.status(500).json({ message: 'Failed to start masked call' });
  }
};
