// src/components/Payment/Checkout.jsx
import React, { useState } from 'react';
import { loadStripe }    from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

function CheckoutForm() {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!stripe) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/create-checkout-session', { method: 'POST' });
      const { id: sessionId } = await res.json();
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) console.error(error.message);
    } catch (err) {
      console.error('Erreur création session :', err);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Payer 10 € (test)</h1>
      <button
        onClick={handleClick}
        disabled={loading || !stripe}
        style={{ padding: '0.75rem 1.5rem' }}
      >
        {loading ? 'Chargement…' : 'Acheter'}
      </button>
    </div>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
