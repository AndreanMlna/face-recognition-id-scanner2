const express = require('express');
const router = express.Router();
const AttendanceLogService = require('../services/AttendanceLogService');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.get('/', authMiddleware, authorizeRole('admin'), async (req, res) => {
  try {
    const logs = await AttendanceLogService.getAll();
    return res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error server' });
  }
});

router.delete('/:id', authMiddleware, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const itemId = parseInt(id);
    if (isNaN(itemId)) return res.status(400).json({ message: 'ID log tidak valid' });

    const deletedCount = await AttendanceLogService.delete(itemId);
    if (deletedCount === 0) return res.status(404).json({ message: 'Log tidak ditemukan' });

    return res.status(200).json({ message: 'Log berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;