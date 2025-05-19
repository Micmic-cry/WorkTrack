// Reverting to a local MongoDB connection for development or in-memory setup
// If you want to use in-memory, comment out the mongoose connection and use your previous storage logic

import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://jcdmaghanoy00913:H06PuysF2bdkIho3@worktrack.mqhjg2i.mongodb.net/test?retryWrites=true&w=majority&appName=WorkTrack';

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected (Atlas)!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
