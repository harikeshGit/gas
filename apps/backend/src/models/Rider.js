import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        isAvailable: { type: Boolean, default: true },
        serviceAreas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceArea' }],
        currentLocation: {
            lat: { type: Number },
            lng: { type: Number },
            updatedAt: { type: Date },
        },
    },
    { timestamps: true }
);

export const Rider = mongoose.model('Rider', riderSchema);
