const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const MONGO_URI = 'mongodb+srv://jcdmaghanoy00913:H06PuysF2bdkIho3@worktrack.mqhjg2i.mongodb.net/test?retryWrites=true&w=majority&appName=WorkTrack';

async function ensureAdmin() {
  await mongoose.connect(MONGO_URI);
  const hash = await bcrypt.hash('admin123', 10);
  await User.deleteMany({ username: 'admin' }); // Remove any old admin
  await User.create({
    username: 'admin',
    password: hash,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'Admin',
    status: 'Active'
  });
  console.log('Admin user created or updated!');
  process.exit(0);
}

ensureAdmin().catch(e => {
  console.error(e);
  process.exit(1);
}); 