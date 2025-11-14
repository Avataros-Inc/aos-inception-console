import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE_URL, getSessionToken } from '../postgrestAPI';

const PaymentForm = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      // Create payment intent or subscription on your server
      const response = await fetch(`${API_BASE_URL}/api/v1/billing/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSessionToken()}`,
        },
        body: JSON.stringify({
          priceId: plan.default_price.id,
          planId: plan.id,
          currency: 'usd',
          amount: plan.default_price.unit_amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to process subscription');
      }

      const responseData = await response.json();

      // Check if backend returned a clientSecret (requires payment confirmation)
      // or subscriptionId (subscription already created/updated)
      if (responseData.clientSecret) {
        // Flow 1: Payment confirmation required
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(responseData.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: 'Customer Name', // You can collect this from a form
            },
          },
        });

        if (stripeError) {
          setError(stripeError.message);
          setProcessing(false);
          return;
        }

        if (paymentIntent.status === 'succeeded') {
          setSucceeded(true);
          onSuccess(paymentIntent);
        }
      } else if (responseData.subscriptionId && responseData.status) {
        // Flow 2: Subscription already created/updated (e.g., for existing customers)
        if (responseData.status === 'active' || responseData.status === 'trialing') {
          setSucceeded(true);
          onSuccess(responseData);
        } else if (responseData.status === 'incomplete' || responseData.status === 'past_due') {
          setError(`Subscription status: ${responseData.status}. Please update your payment method.`);
          setProcessing(false);
        } else {
          setError(`Unexpected subscription status: ${responseData.status}`);
          setProcessing(false);
        }
      } else {
        // Unexpected response format
        console.error('Unexpected API response:', responseData);
        setError('Unexpected response from server. Please contact support.');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'An error occurred while processing your payment');
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="p-6 text-center">
        <div className="text-green-500 text-2xl mb-4">
          <i className="fas fa-check-circle"></i>
        </div>
        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
        <p>Thank you for your purchase of {plan.name} plan.</p>
        <button onClick={onCancel} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Close
        </button>
      </div>
    );
  }

  const cardStyle = {
    style: {
      base: {
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#a0aec0',
          opacity: '0.7',
        },
        '::selection': {
          backgroundColor: '#4a90e2',
          color: '#ffffff',
        },
        ':-webkit-autofill': {
          color: '#ffffff',
        },
        ':focus': {
          color: '#ffffff',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
    classes: {
      base: 'stripe-element',
      focus: 'stripe-element--focus',
      invalid: 'stripe-element--invalid',
    },
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 focus-within:border-blue-500 transition-colors">
            <CardElement
              options={{
                ...cardStyle,
                style: {
                  ...cardStyle.style,
                  base: {
                    ...cardStyle.style.base,
                    '::placeholder': {
                      color: '#a0aec0',
                      opacity: '0.7',
                    },
                    ':-webkit-autofill': {
                      color: '#ffffff',
                    },
                  },
                },
              }}
            />
          </div>
          <style jsx global>{`
            .stripe-element {
              padding: 12px;
              border-radius: 4px;
              background-color: #2d3748;
              transition: all 0.2s ease-in-out;
            }
            .stripe-element--focus {
              box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
            }
            .stripe-element--invalid {
              color: #fa755a;
            }
            .StripeElement {
              height: 40px;
              padding: 10px 12px;
              width: 100%;
              color: #ffffff;
              background-color: #2d3748;
              border: 1px solid #4a5568;
              border-radius: 4px;
              transition: all 0.2s ease-in-out;
            }
            .StripeElement--focus {
              box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
              border-color: #4299e1;
            }
            .StripeElement--invalid {
              border-color: #fa755a;
            }
            .StripeElement--webkit-autofill {
              background-color: #2d3748 !important;
            }
          `}</style>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-6 py-2 rounded-md text-black ${
            processing ? 'bg-[#74ecc8]' : 'bg-[#74ecc8] hover:bg-[#74ecc8d3]'
          }`}
          disabled={!stripe || processing}
        >
          {processing ? 'Processing...' : `Pay $${(plan.default_price.unit_amount / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
