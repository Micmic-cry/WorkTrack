import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false }
});

// Add virtual for id
activitySchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included in JSON output
activitySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Activity = mongoose.model('Activity', activitySchema); 