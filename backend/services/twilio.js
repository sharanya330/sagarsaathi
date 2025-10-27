let twilioClient = null;

export const sendSms = async (to, body) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) {
    throw new Error('Twilio not configured');
  }
  if (!twilioClient) {
    const m = await import('twilio');
    twilioClient = m.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  const res = await twilioClient.messages.create({
    to: to,
    from: process.env.TWILIO_FROM,
    body,
  });
  return res.sid;
};

export const makeMaskedCall = async (toA, toB) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) {
    throw new Error('Twilio not configured');
  }
  if (!twilioClient) {
    const m = await import('twilio');
    twilioClient = m.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  const twiml = `<Response><Dial callerId="${process.env.TWILIO_FROM}"><Number>${toB}</Number></Dial></Response>`;
  const call = await twilioClient.calls.create({
    to: toA,
    from: process.env.TWILIO_FROM,
    twiml,
  });
  return call.sid;
};
