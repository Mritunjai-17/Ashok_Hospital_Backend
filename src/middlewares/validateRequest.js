const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { parsePreferredDate } = require('../utils/dateParser');
const { ENQUIRY_STATUS_LIST } = require('../data/appointmentOptions');

function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Invalid ${paramName}: ${value}`));
    }
    return next();
  };
}

function validateCreateEnquiry(req, _res, next) {
  const errors = [];
  const {
    fullName,
    countryCode,
    mobileNumber,
    preferredDate,
    message,
    consentAgreed,
  } = req.body || {};

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name is required (min 2 characters)' });
  }

  const digits = mobileNumber !== undefined ? String(mobileNumber).replace(/\D/g, '') : '';
  if (!/^\d{10}$/.test(digits)) {
    errors.push({ field: 'mobileNumber', message: 'Valid 10-digit mobile number is required' });
  }

  if (countryCode !== undefined && !/^\+\d{1,4}$/.test(String(countryCode).trim())) {
    errors.push({ field: 'countryCode', message: 'Country code must be in format like +91' });
  }

  if (!preferredDate || !parsePreferredDate(preferredDate)) {
    errors.push({
      field: 'preferredDate',
      message: 'Preferred date is required (DD / MM / YYYY or YYYY-MM-DD)',
    });
  }

  if (message !== undefined && typeof message !== 'string') {
    errors.push({ field: 'message', message: 'Message must be a text string' });
  } else if (typeof message === 'string' && message.trim().length > 1000) {
    errors.push({ field: 'message', message: 'Message cannot exceed 1000 characters' });
  }

  if (consentAgreed !== true) {
    errors.push({
      field: 'consentAgreed',
      message: 'You must agree to the Privacy Policy and consent to being contacted',
    });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  return next();
}

function validateUpdateEnquiry(req, _res, next) {
  const errors = [];
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    return next(new ApiError(400, 'Request body cannot be empty'));
  }

  if (body.fullName !== undefined && (typeof body.fullName !== 'string' || body.fullName.trim().length < 2)) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' });
  }

  if (body.mobileNumber !== undefined) {
    const digits = String(body.mobileNumber).replace(/\D/g, '');
    if (!/^\d{10}$/.test(digits)) {
      errors.push({ field: 'mobileNumber', message: 'Mobile number must be exactly 10 digits' });
    }
  }

  if (body.countryCode !== undefined && !/^\+\d{1,4}$/.test(String(body.countryCode).trim())) {
    errors.push({ field: 'countryCode', message: 'Country code must be in format like +91' });
  }

  if (body.preferredDate !== undefined && !parsePreferredDate(body.preferredDate)) {
    errors.push({ field: 'preferredDate', message: 'Preferred date must be valid' });
  }

  if (body.status !== undefined && !ENQUIRY_STATUS_LIST.includes(body.status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${ENQUIRY_STATUS_LIST.join(', ')}`,
    });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  return next();
}

function validateStatusUpdate(req, _res, next) {
  const { status } = req.body || {};
  if (!status || !ENQUIRY_STATUS_LIST.includes(status)) {
    return next(
      new ApiError(400, `Status is required and must be one of: ${ENQUIRY_STATUS_LIST.join(', ')}`)
    );
  }
  return next();
}

function validateRegister(req, _res, next) {
  const errors = [];
  const { fullName, email, password } = req.body || {};

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name is required (min 2 characters)' });
  }
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }
  return next();
}

function validateLogin(req, _res, next) {
  const errors = [];
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }
  return next();
}

module.exports = {
  validateObjectId,
  validateCreateEnquiry,
  validateUpdateEnquiry,
  validateStatusUpdate,
  validateRegister,
  validateLogin,
};
