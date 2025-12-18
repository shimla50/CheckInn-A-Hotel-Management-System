/**
 * @fileoverview Payment gateway stub - simulates external payment gateway
 * @module utils/paymentGateway
 */

/**
 * Stub function to simulate payment gateway initiation
 * In production, this would integrate with actual payment gateways like Stripe, PayPal, etc.
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.paymentMethod - Payment method (card, online)
 * @param {string} paymentData.bookingId - Booking ID
 * @param {Object} paymentData.customerInfo - Customer information
 * @returns {Promise<Object>} Payment gateway response
 */
export const initiatePaymentGateway = async (paymentData) => {
  const { amount, paymentMethod, bookingId, customerInfo } = paymentData;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate payment processing
  // In a real implementation, this would call the actual payment gateway API
  // For now, we'll simulate success/failure based on amount
  const success = amount > 0 && amount <= 100000; // Simulate failure for very large amounts

  if (success) {
    // Generate a mock transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      success: true,
      transactionId,
      status: 'paid',
      message: 'Payment processed successfully',
      gatewayResponse: {
        // Mock gateway response structure
        id: transactionId,
        status: 'succeeded',
        amount: amount,
        currency: 'USD',
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      },
    };
  } else {
    return {
      success: false,
      transactionId: null,
      status: 'failed',
      message: 'Payment processing failed. Please try again.',
      gatewayResponse: {
        error: {
          type: 'payment_failed',
          message: 'Payment could not be processed',
        },
      },
    };
  }
};

/**
 * Stub function to verify payment status with gateway
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Payment status
 */
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

