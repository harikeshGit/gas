import mongoose from 'mongoose';

const orderStatuses = ['CREATED', 'PAID', 'ASSIGNED', 'PICKED', 'DELIVERED', 'CANCELLED'];

const orderSchema = new mongoose.Schema(
    {
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
        rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },

        cylinderType: { type: String, default: 'Domestic' },
        quantity: { type: Number, default: 1, min: 1 },

        address: { type: String, required: true, trim: true },
        location: {
            lat: { type: Number },
            lng: { type: Number },
        },

        amount: { type: Number, required: true, min: 1 },

        status: { type: String, enum: orderStatuses, default: 'CREATED' },

        payment: {
            mode: { type: String, enum: ['ONLINE', 'CASH'], default: 'ONLINE' },
            status: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
            provider: { type: String, enum: ['demo', 'razorpay', 'cash', 'none'], default: 'none' },
            razorpayOrderId: { type: String },
            razorpayPaymentId: { type: String },
            paidAt: { type: Date },
        },

        deliveryOtp: {
            hash: { type: String },
            expiresAt: { type: Date },
            verifiedAt: { type: Date },
        },

        pickedAt: { type: Date },
        deliveredAt: { type: Date },
        cancelledAt: { type: Date },
    },
    { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
