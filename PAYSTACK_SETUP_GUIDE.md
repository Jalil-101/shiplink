# Paystack Setup Guide for ShipLink

## ✅ Your Current Setup

You have successfully:
- Created a Paystack account
- Obtained test API keys
- Added webhook URL

### Your Test Keys (Keep These Secure!)

```
PAYSTACK_SECRET_KEY=sk_test_3bc39deac5c89f1c8ebcb909de879d2673388993
PAYSTACK_PUBLIC_KEY=pk_test_56824b61526777269001b9b780f06cb37516955c
```

### Webhook URL
```
https://shiplink-q4hu.onrender.com/api/payments/webhook
```

---

## 📝 Next Steps

### 1. Get Webhook Secret

1. Log into your Paystack Dashboard
2. Go to **Settings** → **API Keys & Webhooks**
3. Find your webhook URL in the list
4. Click on it or click "View Details"
5. You should see a **Webhook Secret** (starts with `whsec_` or `wh_`)
6. Copy this secret - you'll need it for environment variables

**Note**: If you don't see a webhook secret, Paystack may generate it automatically when the first webhook is sent. Check back after testing a payment.

### 2. Set Environment Variables

Add these to your backend `.env` file and Render environment variables:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_3bc39deac5c89f1c8ebcb909de879d2673388993
PAYSTACK_PUBLIC_KEY=pk_test_56824b61526777269001b9b780f06cb37516955c
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Get this from Paystack dashboard

# Frontend URL for payment callbacks
FRONTEND_URL=https://shiplink-app.vercel.app
```

### 3. Webhook Events

**Good News**: Paystack automatically sends all relevant events to your webhook URL. You don't need to manually select events.

Our backend handles these events:
- ✅ `charge.success` - Payment successful
- ✅ `charge.failed` - Payment failed
- ✅ `transfer.success` - Transfer successful (for payouts)
- ✅ `transfer.failed` - Transfer failed

The webhook handler in `backend/controllers/payment.controller.js` will automatically process these events.

### 4. Test Payment Flow

#### Test Cards (Paystack Test Mode)

**Successful Payment:**
- Card Number: `4084084084084081`
- CVV: Any 3 digits (e.g., `408`)
- Expiry: Any future date (e.g., `12/25`)
- PIN: Any 4 digits (e.g., `0000`)

**Declined Payment:**
- Card Number: `5060666666666666666`
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: Any 4 digits

**Insufficient Funds:**
- Card Number: `5060666666666666667`
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: Any 4 digits

#### Test Mobile Money

For Mobile Money testing in Ghana:
- Use test phone numbers provided by Paystack
- MTN: Test numbers start with `0244...`
- Vodafone: Test numbers start with `020...`
- AirtelTigo: Test numbers start with `027...`

Check Paystack documentation for current test numbers.

### 5. Verify Webhook is Working

1. Make a test payment through your app
2. Check your backend logs for webhook events
3. Verify the payment status updates in your database
4. Check Paystack Dashboard → **Transactions** → **Webhooks** to see webhook delivery status

### 6. Testing Checklist

- [ ] Environment variables set in backend
- [ ] Webhook secret obtained and set
- [ ] Test payment with card (success)
- [ ] Test payment with card (decline)
- [ ] Test payment with mobile money
- [ ] Verify webhook receives events
- [ ] Verify order status updates after payment
- [ ] Verify payment record created in database

---

## 🔄 Switching to Live Mode

When you're ready for production:

1. **Complete Business Verification**
   - Submit required business documents
   - Wait for Paystack approval (1-3 business days)

2. **Get Live Keys**
   - In Paystack Dashboard, switch to **Live Mode**
   - Copy your live keys:
     - `PAYSTACK_SECRET_KEY` (starts with `sk_live_...`)
     - `PAYSTACK_PUBLIC_KEY` (starts with `pk_live_...`)

3. **Update Webhook**
   - Update webhook URL if needed
   - Get new webhook secret for live mode

4. **Update Environment Variables**
   - Replace test keys with live keys in production environment
   - Update `PAYSTACK_WEBHOOK_SECRET` with live webhook secret

5. **Test with Small Amount**
   - Make a small real payment to verify everything works
   - Monitor webhook events

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. **Check Webhook URL**: Ensure it's accessible (not behind firewall)
2. **Check Webhook Secret**: Must match in both Paystack and backend
3. **Check Backend Logs**: Look for webhook errors
4. **Test Webhook**: Use Paystack's webhook testing tool in dashboard

### Payment Initialization Fails

1. **Check API Keys**: Ensure they're correct and for the right environment (test vs live)
2. **Check Amount**: Must be in kobo (smallest currency unit) - backend handles this
3. **Check Network**: Ensure backend can reach Paystack API

### Payment Verification Fails

1. **Check Reference**: Ensure payment reference is correct
2. **Check Order ID**: Must match the order in database
3. **Check Payment Status**: Payment might already be verified

---

## 📚 Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api)
- [Paystack Test Cards](https://paystack.com/docs/payments/test-payments)
- [Paystack Webhooks Guide](https://paystack.com/docs/payments/webhooks)

---

## 🔒 Security Notes

- ⚠️ **Never commit API keys to git**
- ⚠️ **Use environment variables for all secrets**
- ⚠️ **Rotate keys if exposed**
- ⚠️ **Use test keys for development, live keys only in production**
- ⚠️ **Keep webhook secret secure**

---

**Last Updated**: 2025-01-13
**Status**: Ready for Testing

