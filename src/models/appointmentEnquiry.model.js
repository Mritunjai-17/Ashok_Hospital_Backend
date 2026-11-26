const crypto = require('crypto');
const mongoose = require('mongoose');
const {
  doctorName: DEFAULT_DOCTOR,
  defaultCountryCode: DEFAULT_COUNTRY_CODE,
  ENQUIRY_STATUS,
  ENQUIRY_STATUS_LIST,
} = require('../data/appointmentOptions');
const { formatDisplayDate } = require('../utils/dateParser');

function generateReferenceId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ENQ-${datePart}-${randomPart}`;
}

const appointmentEnquirySchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      index: true,
      default: generateReferenceId,
    },
    doctorName: {
      type: String,
      trim: true,
      default: DEFAULT_DOCTOR,
      maxlength: [100, 'Doctor name cannot exceed 100 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    countryCode: {
      type: String,
      trim: true,
      default: DEFAULT_COUNTRY_CODE,
      match: [/^\+\d{1,4}$/, 'Country code must be in format like +91'],
    },
    mobileNumber: {
      type: String,
      required: [true, '10-digit mobile number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'],
      index: true,
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
      index: true,
    },
    preferredTime: {
      type: String,
      trim: true,
      default: 'Any time',
      maxlength: [80, 'Preferred time cannot exceed 80 characters'],
    },
    consultationPreference: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Consultation preference cannot exceed 80 characters'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    consentAgreed: {
      type: Boolean,
      required: [true, 'Privacy Policy consent is required'],
      validate: {
        validator: (value) => value === true,
        message: 'You must agree to the Privacy Policy and consent to being contacted',
      },
    },
    consentTimestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ENQUIRY_STATUS_LIST,
      default: ENQUIRY_STATUS.PENDING,
      index: true,
    },
    confirmedDate: {
      type: Date,
      default: null,
    },
    confirmedTime: {
      type: String,
      trim: true,
      default: '',
      maxlength: [80, 'Confirmed time cannot exceed 80 characters'],
    },
    staffNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Staff notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

appointmentEnquirySchema.virtual('fullMobileNumber').get(function () {
  return `${this.countryCode}${this.mobileNumber}`;
});

appointmentEnquirySchema.virtual('preferredDateFormatted').get(function () {
  return formatDisplayDate(this.preferredDate);
});

appointmentEnquirySchema.index({ preferredDate: 1, preferredTime: 1, status: 1 });

module.exports =
  mongoose.models.AppointmentEnquiry ||
  mongoose.model('AppointmentEnquiry', appointmentEnquirySchema);
