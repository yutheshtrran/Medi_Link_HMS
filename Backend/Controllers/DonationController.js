// controllers/DonationController.js
import dotenv from 'dotenv';
dotenv.config(); // ✅ Load environment variables before using them

import Stripe from 'stripe';
import donationModel from '../Models/DonationModel.js';
import patientModel from '../Models/PatientModel.js';

// ✅ Confirm env variable exists (optional, but helpful for debugging)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ This will now work

const createCheckoutSession = async (req, res) => {
  try {
    const { amount, email, message, currency, userId } = req.body;

    const user = await patientModel.findById(userId).select('name');
    const userName = user?.name || 'Anonymous';

    const currencyCode = currency?.toLowerCase() || 'usd';

    const successURL = `http://localhost:5173/donation-success?name=${encodeURIComponent(userName)}&amount=${amount}&email=${email}&message=${encodeURIComponent(message || '')}`;

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currencyCode,
            product_data: {
              name: `Donation by ${userName}`,
              description: message || 'Support for patients',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: successURL,
      cancel_url: 'http://localhost:5173/donation-cancelled',
      metadata: {
        userId,
        userName,
        email,
        amount,
        currency: currencyCode,
        message,
      }
    });

    res.json({ success: true, url: stripeSession.url });

  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTotalDonations = async (req, res) => {
  try {
    const result = await donationModel.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const total = result[0]?.total || 0;

    res.json({ success: true, total });
  } catch (error) {
    console.error("Error fetching total donations:", error);
    res.status(500).json({ success: false, message: "Error fetching donations" });
  }
};

export { createCheckoutSession, getTotalDonations };
