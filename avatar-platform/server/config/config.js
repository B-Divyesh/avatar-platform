require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  streamChat: {
    apiKey: process.env.STREAM_API_KEY,
    apiSecret: process.env.STREAM_API_SECRET,
  },
  blockchain: {
    contractAddress: process.env.CONTRACT_ADDRESS,
    chainId: process.env.CHAIN_ID,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'avatarsecretkey',
    expiresIn: '7d',
  },
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
};

module.exports = config;