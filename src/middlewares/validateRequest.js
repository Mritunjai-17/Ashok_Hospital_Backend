const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { parsePreferredDate } = require('../utils/dateParser');
const { normalizeEnquiryPayload } = require('../utils/enquiryNormalizer');
const {
  bookingForOptions,
  consultationTypes,
  areasOfSupport,
  consultationPreferences,
  preferredTimeSlots,
  ENQUIRY_STATUS_LIST,
} = require('../data/appointmentOptions');

function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Invalid ${paramName}: ${value}`));
    }
    return next();
  };
}

function validateEnumField(errors, field, value, allowedValues, label, required = false) {
  if (!value) {
    if (required) {
      errors.push({
        field,
        message: `${label} is required (${allowedValues.join(', ')})`,
      });
    }
    return;
  }

  if (!allowedValues.includes(value)) {
    errors.push({
      field,
      message: `${label} must be one of: ${allowedValues.join(', ')}`,
    });
  }
}

function validateOptionalTopics(errors, rawTopics, normalizedTopics) {
  if (rawTopics === undefined || rawTopics === null || rawTopics === '') return;

  if (!Array.isArray(rawTopics) && typeof rawTopics !== 'string') {
    errors.push({ field: 'supportTopics', message: 'Support topics must be an array of text values' });
    return;
  }

  if (Array.isArray(rawTopics) && rawTopics.some((item) => typeof item !== 'string')) {
    errors.push({ field: 'supportTopics', message: 'Each support topic must be a text string' });
    return;
  }

  if (normalizedTopics.length > 10) {
    errors.push({ field: 'supportTopics', message: 'You can select up to 10 support topics' });
    return;
  }

  if (normalizedTopics.some((topic) => topic.length > 80)) {
    errors.push({ field: 'supportTopics', message: 'Each support topic cannot exceed 80 characters' });
  }
}

function validateOptionalEmail(errors, email) {
  if (email === undefined || email === '') return;

  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || email.length > 160) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
}

function validateCreateEnquiry(req, _res, next) {
  const rawBody = req.body || {};
  const body = normalizeEnquiryPayload(rawBody, { applyDefaults: true });
  const errors = [];

  validateEnumField(errors, 'bookingFor', body.bookingFor, bookingForOptions, 'Booking for', true);
  validateEnumField(
    errors,
    'consultationType',
    body.consultationType,
    consultationTypes,
    'Consultation type',
    true
  );
  validateEnumField(
    errors,
    'areaOfSupport',
    body.areaOfSupport,
    areasOfSupport,
    'Area of support',
    false
  );

  const rawTopics =
    rawBody.supportTopics !== undefined ? rawBody.supportTopics : rawBody.specificTopics;
  validateOptionalTopics(errors, rawTopics, body.supportTopics);

  validateEnumField(
    errors,
    'consultationPreference',
    body.consultationPreference,
    consultationPreferences,
    'Consultation preference',
    true
  );

  if (!body.preferredDate || !parsePreferredDate(body.preferredDate)) {
    errors.push({
      field: 'preferredDate',
      message: 'Preferred date is required (YYYY-MM-DD, DD / MM / YYYY, or Sat, 28 Nov 2026)',
    });
  }

  validateEnumField(
    errors,
    'preferredTime',
    body.preferredTime,
    preferredTimeSlots,
    'Preferred time',
    true
  );

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'Full name is required (min 2 characters)' });
  } else if (body.fullName.length > 100) {
    errors.push({ field: 'fullName', message: 'Full name cannot exceed 100 characters' });
  }

  if (!/^\d{10}$/.test(body.mobileNumber || '')) {
    errors.push({ field: 'mobileNumber', message: 'Valid 10-digit mobile number is required' });
  }

  if (body.countryCode && !/^\+\d{1,4}$/.test(body.countryCode)) {
    errors.push({ field: 'countryCode', message: 'Country code must be in format like +91' });
  }

  validateOptionalEmail(errors, body.email);

  if (body.message !== undefined && typeof body.message !== 'string') {
    errors.push({ field: 'message', message: 'Message must be a text string' });
  } else if (typeof body.message === 'string' && body.message.length > 1000) {
    errors.push({ field: 'message', message: 'Message cannot exceed 1000 characters' });
  }

  if (body.consentAgreed !== true) {
    errors.push({
      field: 'consentAgreed',
      message: 'You must agree to the Privacy Policy and consent to being contacted',
    });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  req.body = body;
  return next();
}

function validateUpdateEnquiry(req, _res, next) {
  const rawBody = req.body || {};
  if (Object.keys(rawBody).length === 0) {
    return next(new ApiError(400, 'Request body cannot be empty'));
  }

  const body = normalizeEnquiryPayload(rawBody, { applyDefaults: false });
  const errors = [];

  if (body.bookingFor !== undefined) {
    validateEnumField(errors, 'bookingFor', body.bookingFor, bookingForOptions, 'Booking for', true);
  }
  if (body.consultationType !== undefined) {
    validateEnumField(
      errors,
      'consultationType',
      body.consultationType,
      consultationTypes,
      'Consultation type',
      true
    );
  }
  if (body.areaOfSupport !== undefined) {
    validateEnumField(
      errors,
      'areaOfSupport',
      body.areaOfSupport,
      areasOfSupport,
      'Area of support',
      false
    );
  }

  const rawTopics =
    rawBody.supportTopics !== undefined ? rawBody.supportTopics : rawBody.specificTopics;
  if (rawTopics !== undefined) {
    validateOptionalTopics(errors, rawTopics, body.supportTopics || []);
  }

  if (body.consultationPreference !== undefined) {
    validateEnumField(
      errors,
      'consultationPreference',
      body.consultationPreference,
      consultationPreferences,
      'Consultation preference',
      true
    );
  }
  if (body.preferredTime !== undefined) {
    validateEnumField(
      errors,
      'preferredTime',
      body.preferredTime,
      preferredTimeSlots,
      'Preferred time',
      true
    );
  }

  if (body.fullName !== undefined && (typeof body.fullName !== 'string' || body.fullName.length < 2)) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' });
  }

  if (body.mobileNumber !== undefined && !/^\d{10}$/.test(body.mobileNumber)) {
    errors.push({ field: 'mobileNumber', message: 'Mobile number must be exactly 10 digits' });
  }

  if (body.countryCode !== undefined && !/^\+\d{1,4}$/.test(body.countryCode)) {
    errors.push({ field: 'countryCode', message: 'Country code must be in format like +91' });
  }

  if (body.email !== undefined) {
    validateOptionalEmail(errors, body.email);
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

  req.body = body;
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
