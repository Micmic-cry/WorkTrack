import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://jcdmaghanoy00913:YNm9hOWWEJIqo4Dl@worktrack.mqhjg2i.mongodb.net/worktrack?retryWrites=true&w=majority&appName=WorkTrack';

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to set the MongoDB connection string?",
  );
}

async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export const db = mongoose;
export { connectDB };
