import mongoose from 'mongoose';

const serviceAreaSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        city: { type: String, trim: true },
        center: {
            lat: { type: Number },
            lng: { type: Number },
        },
        radiusKm: { type: Number, default: 5 },
    },
    { timestamps: true }
);

export const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
