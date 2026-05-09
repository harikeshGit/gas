import Razorpay from 'razorpay';

function isRazorpayConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createPaymentOrder({ amountInRupees, receipt }) {
    if (!isRazorpayConfigured()) {
        return {
            demo: true,
            provider: 'demo',
            amount: amountInRupees,
            receipt,
        };
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
        amount: Math.round(amountInRupees * 100),
        currency: 'INR',
        receipt,
    });

    return {
        demo: false,
        provider: 'razorpay',
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: order.id,
        amount: amountInRupees,
    };
}
