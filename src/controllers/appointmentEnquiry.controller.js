const appointmentEnquiryService = require('../services/appointmentEnquiry.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getFormOptions = asyncHandler(async (_req, res) => {
  const options = appointmentEnquiryService.getFormOptions();
  res.status(200).json(new ApiResponse(200, options, 'Appointment form options fetched'));
});

const createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await appointmentEnquiryService.createEnquiry(req.body);
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        enquiry,
        'Appointment enquiry submitted. Our team will confirm your appointment availability.'
      )
    );
});

const getAllEnquiries = asyncHandler(async (req, res) => {
  const result = await appointmentEnquiryService.getAllEnquiries(req.query);
  res.status(200).json(
    new ApiResponse(200, result.items, 'Appointment enquiries fetched', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    })
  );
});

const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await appointmentEnquiryService.getEnquiryById(req.params.id);
  res.status(200).json(new ApiResponse(200, enquiry, 'Appointment enquiry fetched'));
});

const getEnquiryByReference = asyncHandler(async (req, res) => {
  const enquiry = await appointmentEnquiryService.getEnquiryByReference(req.params.referenceId);
  res.status(200).json(new ApiResponse(200, enquiry, 'Appointment enquiry fetched'));
});

const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await appointmentEnquiryService.updateEnquiry(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, enquiry, 'Appointment enquiry updated'));
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await appointmentEnquiryService.updateEnquiryStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, enquiry, 'Appointment enquiry status updated'));
});

const deleteEnquiry = asyncHandler(async (req, res) => {
  const deleted = await appointmentEnquiryService.deleteEnquiry(req.params.id);
  res.status(200).json(new ApiResponse(200, deleted, 'Appointment enquiry deleted'));
});

module.exports = {
  getFormOptions,
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  getEnquiryByReference,
  updateEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
};
