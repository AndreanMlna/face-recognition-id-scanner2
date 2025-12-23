const express = require('express');
const router = express.Router();
const PermissionService = require('../services/PermissionService');
const { authorizeRole, authMiddleware } = require('../middleware/auth');

router.get('/my-history', authMiddleware, authorizeRole('student'), async (req, res) => {
  try {
    const history = await PermissionService.getByUser(req.user.id);
    return res.status(200).json(history);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error server' });
  }
});

router.post('/request', authMiddleware, authorizeRole('student'), async (req, res) => {
  try {
    const { reason, start_time, end_time } = req.body

    if (!reason || !start_time || !end_time) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const newRequest = await PermissionService.create(req.user.id, { reason, start_time, end_time });
    res.status(201).json({ message: 'Permintaan berhasil dibuat', permission: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error server' });
  }
});

router.get('/admin/all', authMiddleware, authorizeRole('admin'), async (req, res) => {
  try {
    const request = await PermissionService.getAll();
    return res.status(200).json(request);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error server' });
  }
});

router.patch('/admin/status/:id', authMiddleware, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'denied'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    const updatedPermission = await PermissionService.updateStatus(id, status);

    if (!updatedPermission) {
      return res.status(404).json({ message: 'Data perizinan tidak ditemukan' });
    }

    res.status(200).json({
      message: `Izin berhasil di-${status}`,
      data: updatedPermission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return res.status(400).json({ message: 'ID item tidak valid' });
    }

    const deletedCount = await PermissionService.delete(itemId);

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan' });
    }

    return res.status(200).json({ message: 'Item berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;