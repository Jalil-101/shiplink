# Order Payment Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Payment service is not configured" Error

**Cause**: Paystack environment variables are not set on the backend server.

**Solution**:
1. Go to your Render dashboard (or wherever your backend is hosted)
2. Navigate to **Environment Variables**
3. Add these variables:

```env
PAYSTACK_SECRET_KEY=sk_test_3bc39deac5c89f1c8ebcb909de879d2673388993
PAYSTACK_PUBLIC_KEY=pk_test_56824b61526777269001b9b780f06cb37516955c
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Get from Paystack dashboard
FRONTEND_URL=https://shiplink-app.vercel.app
```

4. **Restart your backend server** after adding the variables

### Issue 2: "Failed to initialize payment" Error

**Possible Causes**:
- Invalid Paystack API keys
- Network connectivity issues
- Paystack API is down

**Solution**:
1. Verify your Paystack keys are correct (test keys start with `sk_test_` and `pk_test_`)
2. Check Paystack status: https://status.paystack.com
3. Verify your backend can reach `api.paystack.co`
4. Check backend logs for detailed error messages

### Issue 3: "Cart is empty" Error

**Cause**: Trying to checkout with an empty cart.

**Solution**:
- Add items to cart before checkout
- Refresh the cart if items disappeared

### Issue 4: "Product is no longer available" Error

**Cause**: Product was deleted or deactivated between adding to cart and checkout.

**Solution**:
- Remove unavailable items from cart
- Try again with available products

### Issue 5: Order Created But Payment Fails

**What Happens**:
- Order is created with `paymentStatus: 'pending'`
- Payment initialization fails
- Order remains in "pending" payment status

**Solution**:
1. Check backend logs for payment initialization errors
2. Verify Paystack keys are set correctly
3. Try the payment again from the orders screen
4. If payment succeeds later, order will be updated automatically

## How to Check Backend Logs

### On Render:
1. Go to your service dashboard
2. Click on **Logs** tab
3. Look for errors related to:
   - "Paystack"
   - "initializePayment"
   - "PAYSTACK_SECRET_KEY"

### Common Log Messages:

**Good** (Payment initialized successfully):
```
Paystack payment initialized: reference=SHIPLINK_...
```

**Bad** (Missing configuration):
```
⚠️  WARNING: PAYSTACK_SECRET_KEY is not set. Payment functionality will not work.
```

**Bad** (API error):
```
Paystack API error: [error details]
```

## Testing Payment Flow

### Step 1: Verify Environment Variables
```bash
# On your backend server, check if variables are set
echo $PAYSTACK_SECRET_KEY
```

### Step 2: Test with Paystack Test Card
- Card: `4084084084084081`
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: Any 4 digits

### Step 3: Check Order Creation
1. Add product to cart
2. Go to checkout
3. Fill in delivery details (if needed)
4. Select payment method
5. Click "Place Order"
6. Check if order is created (even if payment fails)

## Quick Fix Checklist

- [ ] Paystack keys added to backend environment variables
- [ ] Backend server restarted after adding variables
- [ ] Paystack keys are test keys (for testing) or live keys (for production)
- [ ] Webhook URL is set in Paystack dashboard
- [ ] Backend can reach Paystack API (no firewall blocking)
- [ ] Cart has items before checkout
- [ ] Products in cart are still available

## Still Having Issues?

1. **Check the exact error message** - It will tell you what's wrong
2. **Check backend logs** - Most errors are logged there
3. **Verify environment variables** - Make sure they're set and correct
4. **Test with Paystack test card** - Use the test card numbers provided
5. **Check network connectivity** - Backend must be able to reach Paystack

---

**Last Updated**: 2025-01-13

