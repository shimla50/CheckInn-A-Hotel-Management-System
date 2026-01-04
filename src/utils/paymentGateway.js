/**
 * @fileoverview Payment gateway stub - simulates external payment gateway
 * @module utils/paymentGateway
 */

/**
 * Stub function to simulate payment gateway initiation
 * In production, this would integrate with actual payment gateways like Stripe, PayPal, etc.
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.paymentMethod - Payment method (card, online, sslcommerz)
 * @param {string} paymentData.bookingId - Booking ID
 * @param {Object} paymentData.customerInfo - Customer information
 * @returns {Promise<Object>} Payment gateway response
 */

export const initiatePaymentGateway = async (paymentData) => {
  const { amount, paymentMethod, bookingId, customerInfo } = paymentData;

  // Basic validation
  if (!amount || amount <= 0) {
    return { success: false, message: 'Invalid amount' };
  }

  // ---- REAL SSLCommerz session creation (redirect flow) ----
  // NOTE: You must set these env vars in your backend .env for this to work:
  // SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD
  // Optional: SSLCOMMERZ_MODE=sandbox|live (default: sandbox)
  // Optional: SSLCOMMERZ_SUCCESS_URL, SSLCOMMERZ_FAIL_URL, SSLCOMMERZ_CANCEL_URL, SSLCOMMERZ_IPN_URL
  if (paymentMethod === 'sslcommerz') {
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Demo mode: If store_id is "demo", simulate payment locally without calling SSLCommerz
    if (store_id === 'demo') {
      const transactionId = `SSLC-DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
      
      console.log('🔧 SSLCommerz DEMO MODE: Simulating successful payment locally');
      
      return {
        success: true,
        transactionId,
        status: 'paid',
        message: 'Payment processed successfully (demo mode)',
        gatewayResponse: {
          status: 'SUCCESS',
          mode: 'demo',
          transactionId,
        },
        isDemo: true, // Flag to indicate this is a demo payment
      };
    }

    // Development mode: Create mock redirect URL if credentials are missing
    if ((!store_id || !store_passwd) && isDevelopment) {
      const transactionId = `SSLC-DEV-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
      const baseBackendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`;
      
      // Create a mock SSLCommerz payment page URL for development
      // This will redirect to the success page after a delay
      const mockRedirectUrl = `${baseBackendUrl}/api/billing/sslcommerz/mock-payment?tran_id=${transactionId}&amount=${amount}&bookingId=${bookingId}`;
      
      console.warn('⚠️  SSLCommerz credentials not set. Using development mode with mock payment page.');
      console.warn('   Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in .env for production.');
      
      return {
        success: true,
        transactionId,
        status: 'pending',
        redirectUrl: mockRedirectUrl,
        gatewayResponse: {
          status: 'SUCCESS',
          GatewayPageURL: mockRedirectUrl,
          mode: 'development',
        },
      };
    }

    if (!store_id || !store_passwd) {
      return {
        success: false,
        message: 'SSLCommerz credentials missing. Please set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in .env',
      };
    }

    const mode = (process.env.SSLCOMMERZ_MODE || 'sandbox').toLowerCase();
    const apiUrl =
      mode === 'live'
        ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    // Generate transaction ID
    const transactionId = `SSLC-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

    // Callback URLs (you can point these to your frontend too, but backend is typical)
    const baseBackendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    const success_url = process.env.SSLCOMMERZ_SUCCESS_URL || `${baseBackendUrl}/api/billing/sslcommerz/success`;
    const fail_url = process.env.SSLCOMMERZ_FAIL_URL || `${baseBackendUrl}/api/billing/sslcommerz/fail`;
    const cancel_url = process.env.SSLCOMMERZ_CANCEL_URL || `${baseBackendUrl}/api/billing/sslcommerz/cancel`;
    const ipn_url = process.env.SSLCOMMERZ_IPN_URL || `${baseBackendUrl}/api/billing/sslcommerz/ipn`;

    // Minimal required fields for SSLCommerz session API
    const form = new URLSearchParams({
      store_id,
      store_passwd,
      total_amount: String(amount),
      currency: 'BDT',
      tran_id: transactionId,
      success_url,
      fail_url,
      cancel_url,
      ipn_url,

      // Product/profile info (required by SSLCommerz)
      product_name: `Hotel booking ${String(bookingId).slice(-8)}`,
      product_category: 'Hotel',
      product_profile: 'general',

      // Customer info
      cus_name: customerInfo?.name || 'Guest',
      cus_email: customerInfo?.email || 'guest@example.com',
      cus_add1: 'N/A',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: '00000000000',

      shipping_method: 'NO',
      num_of_item: '1',
    });

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        return { success: false, message: 'SSLCommerz API request failed', gatewayResponse: data || null };
      }

      // SSLCommerz returns { status: "SUCCESS", GatewayPageURL: "...", ... }
      if (data.status === 'SUCCESS' && data.GatewayPageURL) {
        return {
          success: true,
          transactionId,
          status: 'pending',
          redirectUrl: data.GatewayPageURL,
          gatewayResponse: data,
        };
      }

      return {
        success: false,
        transactionId,
        status: 'failed',
        message: data.failedreason || data.status || 'SSLCommerz session failed',
        gatewayResponse: data,
      };
    } catch (err) {
      return { success: false, message: `SSLCommerz error: ${err.message}` };
    }
  }

  // ---- Existing stub simulation for "online" and other gateways ----
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const success = amount > 0 && amount <= 100000;

  if (success) {
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      success: true,
      transactionId,
      status: 'paid',
      message: 'Payment processed successfully',
      gatewayResponse: {
        id: transactionId,
        status: 'succeeded',
        amount,
        currency: 'BDT',
        paymentMethod,
      },
    };
  }

  return {
    success: false,
    status: 'failed',
    message: 'Payment failed - invalid amount or processing error',
  };
};


export const verifyPaymentStatus = async (transactionId) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In production, this would query the actual payment gateway
  return {
    transactionId,
    status: 'paid',
    verified: true,
  };
};