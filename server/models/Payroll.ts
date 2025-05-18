import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  periodStart: { type: String, required: true },
  periodEnd: { type: String, required: true },
  basicPay: { type: Number, required: true },
  overtimePay: { type: Number, default: 0 },
  deductions: [{
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String }
  }],
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processed', 'Paid'], default: 'Pending' },
  paymentDate: { type: String }
});

// Add virtual for id
payrollSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included in JSON output
payrollSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Payroll = mongoose.model('Payroll', payrollSchema); 