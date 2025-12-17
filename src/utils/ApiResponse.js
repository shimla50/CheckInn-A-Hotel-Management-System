/**
 * @fileoverview Standardized API response helper
 * @module utils/ApiResponse
 */

/**
 * Creates a standardized API response object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {*} data - Response data (optional)
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Standardized response object
 */
const ApiResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success,
    message,
    data,
    statusCode,
  };
};

/**
 * Creates a success response
 * @param {string} message - Success message
 * @param {*} data - Response data (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Success response object
 */
export const successResponse = (message, data = null, statusCode = 200) => {
  return ApiResponse(true, message, data, statusCode);
};

/**
 * Creates an error response
 * @param {string} message - Error message
 * @param {*} data - Error data (optional)
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Error response object
 */
export const errorResponse = (message, data = null, statusCode = 400) => {
  return ApiResponse(false, message, data, statusCode);
};

export default ApiResponse;

