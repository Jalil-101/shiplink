# ShipLink Testing Checklist

## Overview

This checklist covers manual end-to-end testing for the ShipLink application. Automated testing can be added later as the project matures.

---

## 🔐 Authentication Flow

### User Registration
- [ ] Register new user with valid email
- [ ] Register with invalid email (should show error)
- [ ] Register with weak password (should show error)
- [ ] Register with existing email (should show error)
- [ ] Verify user is redirected after registration

### User Login
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should show error)
- [ ] Login with non-existent email (should show error)
- [ ] Verify session persists after app restart
- [ ] Verify logout works correctly

### Password Reset
- [ ] Request password reset with valid email
- [ ] Request password reset with invalid email
- [ ] Verify reset email is received (if implemented)

---

## 🛒 Marketplace Flow

### Product Browsing
- [ ] View product list on home screen
- [ ] View featured products carousel
- [ ] Search for products (3+ characters)
- [ ] Filter products by category
- [ ] View product details
- [ ] Scroll through product images (if multiple)
- [ ] View product description

### Shopping Cart
- [ ] Add product to cart
- [ ] Add multiple products to cart
- [ ] Update item quantity in cart
- [ ] Remove item from cart
- [ ] View cart total (in GHS)
- [ ] Verify cart persists after app restart

### Checkout & Payment
- [ ] Proceed to checkout
- [ ] Select delivery option (none/pickup/delivery)
- [ ] Enter delivery address (if delivery selected)
- [ ] Select payment method (Mobile Money/Card/Bank Transfer)
- [ ] Enter mobile money details (if selected)
- [ ] Initialize payment with Paystack
- [ ] Complete payment with test card
- [ ] Verify payment success
- [ ] Verify order is created
- [ ] Verify order appears in order history

### Payment Testing (Paystack Test Mode)
- [ ] Test successful payment (card: 4084084084084081)
- [ ] Test declined payment (card: 5060666666666666666)
- [ ] Test insufficient funds (card: 5060666666666666667)
- [ ] Test mobile money payment (if available)
- [ ] Verify webhook receives payment events
- [ ] Verify order status updates after payment

---

## ⭐ Product Reviews & Comments

### Reviews
- [ ] View reviews on product page
- [ ] See average rating and rating distribution
- [ ] Submit review with rating (1-5)
- [ ] Submit review with rating and comment
- [ ] Edit own review
- [ ] Delete own review
- [ ] Mark review as helpful
- [ ] See "Verified Purchase" badge (if user purchased product)
- [ ] Verify one review per user per product

### Comments
- [ ] View comments on product page
- [ ] Post a comment
- [ ] Reply to a comment
- [ ] Edit own comment
- [ ] Delete own comment
- [ ] See comment replies nested
- [ ] Verify comments refresh after posting

---

## 🚚 Delivery Flow

### Create Delivery Request
- [ ] Create delivery request with pickup/dropoff locations
- [ ] Use current location for pickup
- [ ] Enter manual address
- [ ] Calculate delivery fee
- [ ] Submit delivery request
- [ ] Verify request appears in orders

### Track Delivery
- [ ] View delivery status
- [ ] Track delivery by order ID
- [ ] See delivery updates in real-time
- [ ] View delivery details modal

### Driver Flow (if testing driver role)
- [ ] View available delivery requests
- [ ] Accept delivery request
- [ ] Update delivery status
- [ ] Complete delivery

---

## 🔄 Role Switching

### Switch Roles
- [ ] Switch from user to driver (if applicable)
- [ ] Switch from user to seller (if applicable)
- [ ] Switch back to user role
- [ ] Verify navigation updates after role switch
- [ ] Verify back button works correctly

### Apply for Roles
- [ ] Apply for driver role
- [ ] Apply for seller role
- [ ] Apply for sourcing agent role
- [ ] Apply for import coach role
- [ ] View role application status

---

## 📱 Navigation & UI

### Navigation
- [ ] Back button returns to previous screen (not home)
- [ ] Deep links work from notifications
- [ ] Tab navigation works correctly
- [ ] Stack navigation preserved (no unexpected resets)

### UI/UX
- [ ] Dark mode works on all screens
- [ ] Light mode works on all screens
- [ ] Loading states show during API calls
- [ ] Error messages are user-friendly
- [ ] Empty states show when no data
- [ ] Pull-to-refresh works on list screens
- [ ] Images load correctly (or show placeholder)
- [ ] Currency displays in GHS (₵)

### Platform-Specific
- [ ] Android: Tab bar height matches WhatsApp spec
- [ ] Android: Top padding respects status bar
- [ ] iOS: Safe areas respected
- [ ] Both: Keyboard doesn't cover inputs

---

## 🔔 Notifications

### In-App Notifications
- [ ] Receive notification for new order
- [ ] Receive notification for order status update
- [ ] Receive notification for role application approval
- [ ] View notification list
- [ ] Mark notification as read
- [ ] Badge count updates correctly

### Push Notifications (if enabled)
- [ ] Receive push notification for new message
- [ ] Receive push notification for order update
- [ ] Tap notification opens correct screen

---

## 💬 Chat

### User Chat
- [ ] Start chat with logistics company (from order)
- [ ] Send message
- [ ] Receive message
- [ ] See message history
- [ ] UI matches WhatsApp dimensions (purple theme)

### Logistics Company Chat
- [ ] View conversations list
- [ ] Open conversation
- [ ] Send/receive messages
- [ ] Real-time message updates

---

## 🛡️ Error Scenarios

### Network Errors
- [ ] Handle network failure gracefully
- [ ] Show retry option
- [ ] Don't crash on network error

### API Errors
- [ ] Handle 404 errors (product not found)
- [ ] Handle 401 errors (unauthorized)
- [ ] Handle 403 errors (forbidden)
- [ ] Handle 500 errors (server error)
- [ ] Show user-friendly error messages

### Validation Errors
- [ ] Form validation works
- [ ] Invalid inputs show errors
- [ ] Required fields enforced
- [ ] Input sanitization works

### Edge Cases
- [ ] Out of stock product (can't add to cart)
- [ ] Session expiration (force logout)
- [ ] Invalid product ID
- [ ] Empty cart checkout
- [ ] Payment timeout

---

## 🔍 Search & Filter

### Product Search
- [ ] Search by product name
- [ ] Search by category
- [ ] Search shows results after 3+ characters
- [ ] Search results include products and companies
- [ ] Clear search works

### Order Filtering
- [ ] Filter orders by type (all/delivery/marketplace)
- [ ] Filter orders by status (all/processing/shipped/delivered/cancelled)
- [ ] Filter combinations work correctly

---

## 📊 Admin Dashboard (Web)

### Admin Login
- [ ] Login with admin credentials
- [ ] Access admin dashboard

### User Management
- [ ] View all users
- [ ] Suspend/activate user
- [ ] View user details

### Product Management
- [ ] View all products
- [ ] Create product
- [ ] Edit product
- [ ] Delete product
- [ ] Upload product images

### Order Management
- [ ] View all orders
- [ ] Filter orders
- [ ] Update order status
- [ ] View order details

---

## 🚛 Logistics Dashboard (Web)

### Logistics Login
- [ ] Login with logistics company credentials
- [ ] Access logistics dashboard

### Order Management
- [ ] View assigned orders
- [ ] Assign driver to order
- [ ] Update order status
- [ ] Track order location

### Driver Management
- [ ] View available drivers
- [ ] Assign driver to pickup/delivery

### Chat
- [ ] View conversations
- [ ] Chat with customers
- [ ] Real-time message updates

---

## ✅ Completion Criteria

All critical flows should:
- ✅ Work without crashes
- ✅ Show appropriate loading states
- ✅ Handle errors gracefully
- ✅ Provide user feedback
- ✅ Maintain navigation stack
- ✅ Persist data correctly
- ✅ Update in real-time (where applicable)

---

## 📝 Notes

- Test on both Android and iOS if possible
- Test with different screen sizes
- Test with slow network connection
- Document any bugs found
- Prioritize fixes based on severity

---

**Last Updated**: 2025-01-13
**Status**: Ready for Testing

