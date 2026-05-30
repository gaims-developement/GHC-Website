import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentRequestButtonElement, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

function GooglePayPaymentRequest({ amount = 1000, currency = "usd", label = "GHC Payment", onSuccess }) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!stripe) return undefined;

    let active = true;
    const request = stripe.paymentRequest({
      country: "US",
      currency: currency.toLowerCase(),
      total: {
        label,
        amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    request.canMakePayment().then((result) => {
      if (active && result?.googlePay) {
        setPaymentRequest(request);
      }
    });

    request.on("paymentmethod", async (event) => {
      try {
        setStatus("Processing payment...");
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount, currency }),
        });
        const data = await response.json();

        if (!response.ok || !data.clientSecret) {
          event.complete("fail");
          setStatus(data.message || "Unable to start payment.");
          return;
        }

        const confirmation = await stripe.confirmCardPayment(
          data.clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmation.error) {
          event.complete("fail");
          setStatus(confirmation.error.message || "Payment failed.");
          return;
        }

        event.complete("success");

        if (confirmation.paymentIntent.status === "requires_action") {
          const actionResult = await stripe.confirmCardPayment(data.clientSecret);
          if (actionResult.error) {
            setStatus(actionResult.error.message || "Payment authentication failed.");
            return;
          }
        }

        setStatus("Payment complete.");
        onSuccess?.(confirmation.paymentIntent);
      } catch (error) {
        event.complete("fail");
        setStatus(error.message || "Payment failed.");
      }
    });

    return () => {
      active = false;
    };
  }, [amount, currency, label, onSuccess, stripe]);

  if (!stripePromise) {
    return <p>Stripe publishable key is not configured.</p>;
  }

  if (!paymentRequest) {
    return <p>Google Pay is not available in this browser.</p>;
  }

  return (
    <div>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
      {status && <p>{status}</p>}
    </div>
  );
}

function GooglePayButton(props) {
  const options = useMemo(() => ({ mode: "payment", amount: props.amount || 1000, currency: props.currency || "usd" }), [props.amount, props.currency]);

  if (!stripePromise) {
    return <p>Stripe publishable key is not configured.</p>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <GooglePayPaymentRequest {...props} />
    </Elements>
  );
}

export default GooglePayButton;
