import mongoose from 'mongoose';

const dealerSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        businessName: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        serviceAreas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceArea' }],
    },
    { timestamps: true }
);

export const Dealer = mongoose.model('Dealer', dealerSchema);
