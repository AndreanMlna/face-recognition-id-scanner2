const knex = require('../config/database');

const AttendanceLogService = {
  getAll: async () => {
    return await knex('attendance_logs').select('*').orderBy('created_at', 'desc');
  },

  delete: async (id) => {
    return await knex('attendance_logs').where({ id }).del();
  }
};

module.exports = AttendanceLogService;