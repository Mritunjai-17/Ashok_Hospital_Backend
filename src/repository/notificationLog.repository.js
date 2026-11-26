const NotificationLog = require('../models/notificationLog.model');

class NotificationLogRepository {
  async create(payload) {
    return NotificationLog.create(payload);
  }

  async findByEnquiryId(enquiryId) {
    return NotificationLog.find({ enquiryId }).sort({ createdAt: -1 });
  }

  async findAll({ filter = {}, page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      NotificationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationLog.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

module.exports = new NotificationLogRepository();
