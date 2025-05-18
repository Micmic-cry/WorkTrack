import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
});

// Add virtual for id
companySchema.virtual('id').get(function() {
  return this._id.toString();
});

// Ensure virtuals are included in JSON output
companySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Company = mongoose.model('Company', companySchema); 