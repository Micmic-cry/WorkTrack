import mongoose from 'mongoose';

const dtrSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  type: { type: String, required: true },
  status: { 
    type: String, 
    enum: [
      'Present', 'Absent', 'Late', 'On Leave',
      'Pending', 'Approved', 'Rejected', 'Processing'
    ], 
    required: true 
  },
  timeIn: { type: String, required: true },
  timeOut: { type: String, required: true },
  breakHours: { type: Number, default: 0 },
  regularHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  remarks: { type: String },
  submissionDate: { type: String, required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approvalDate: { type: String }
});

// Add virtual for id
dtrSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included in JSON output
dtrSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const DTR = mongoose.model('DTR', dtrSchema); 