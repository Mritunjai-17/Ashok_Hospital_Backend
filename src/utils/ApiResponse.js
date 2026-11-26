/**
 * Standardized API JSON response envelope.
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = undefined) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }
}

module.exports = ApiResponse;
