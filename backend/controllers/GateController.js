const express = require('express');
const router = express.Router();
const GateService = require('../services/GateService');
const knex = require('../config/database');

router.post('/screen', async (req, res) => {
    try {
        const { embedding } = req.body;

        if (!embedding) {
            return res.status(400).json({ message: 'Data scan tidak lengkap' });
        }

        const user = await GateService.identifyUser(embedding);

        if (!user) {
            return res.status(404).json({ message: 'Wajah ga nemu' });
        }

        const autoType = await GateService.determineNextType(user.id)
        const activePermission = await GateService.checkActivePermission(user.id);

        if (activePermission) {
            await knex('attendance_logs').insert({
                permission_id: activePermission.id,
                user_id: user.id,
                type: autoType
            });

            return res.status(200).json({
                message: `Akses diterima. ${autoType}, ${user.nama}!`,
                type: autoType
            });
        } else {
            const [violation] = await knex('permissions').insert({
                user_id: user.id,
                status: 'violation',
                reason: `Terdeteksi mencoba melakukan ${autoType} tanpa izin resmi.`,
                start_time: knex.fn.now(),
                end_time: knex.fn.now()
            }).returning('*');

            await knex('attendance_logs').insert({
                permission_id: violation.id,
                user_id: user.id,
                type: autoType
            });

            return res.status(403).json({
                message: `Pelanggaran! Anda mencoba ${autoType} tanpa izin.`,
                reason: 'No active permission'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server' })
    }
})

module.exports = router;
