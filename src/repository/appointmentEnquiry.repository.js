const AppointmentEnquiry = require('../models/appointmentEnquiry.model');

class AppointmentEnquiryRepository {
  async create(payload) {
    return AppointmentEnquiry.create(payload);
  }

  async findById(id) {
    return AppointmentEnquiry.findById(id);
  }

  async findByReferenceId(referenceId) {
    return AppointmentEnquiry.findOne({ referenceId: referenceId.toUpperCase() });
  }

  async findAll({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AppointmentEnquiry.find(filter).sort(sort).skip(skip).limit(limit),
      AppointmentEnquiry.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateById(id, updateData) {
    return AppointmentEnquiry.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });
  }

  async deleteById(id) {
    return AppointmentEnquiry.findByIdAndDelete(id);
  }

  async countActiveBookingsForDate(date, doctorName) {
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const query = {
      preferredDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed', 'rescheduled'] },
    };

    if (doctorName) {
      query.doctorName = doctorName;
    }

    return AppointmentEnquiry.find(query).select('preferredTime status referenceId');
  }
}

module.exports = new AppointmentEnquiryRepository();
