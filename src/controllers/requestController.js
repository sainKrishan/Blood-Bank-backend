import pool from '../config/db.js';
import { isEligible } from '../utils/bloodCompatibility.js';

export const requestBloodSample = async (req, res) => {
    const { sample_id } = req.body;
    const receiver_id = req.user.id;
    const receiver_blood_group = req.user.blood_group;

    if (!sample_id) {
        return res.status(400).json({ message: 'Sample ID is required.' });
    }

    try {
        // Check sample exists
        const [samples] = await pool.query('SELECT * FROM blood_samples WHERE id = ?', [sample_id]);
        if (samples.length === 0) {
            return res.status(404).json({ message: 'Blood sample not found.' });
        }
        const sample = samples[0];

        // Check blood compatibility
        if (!isEligible(receiver_blood_group, sample.blood_group)) {
            return res.status(400).json({
                message: `Your blood group (${receiver_blood_group}) is not compatible with ${sample.blood_group}.`
            });
        }

        // Prevent duplicate requests (also enforced by DB UNIQUE KEY)
        const [duplicate] = await pool.query(
            'SELECT id FROM blood_requests WHERE sample_id = ? AND receiver_id = ?',
            [sample_id, receiver_id]
        );
        if (duplicate.length > 0) {
            return res.status(400).json({ message: 'You have already requested this blood sample.' });
        }

        await pool.query(
            'INSERT INTO blood_requests (sample_id, receiver_id) VALUES (?, ?)',
            [sample_id, receiver_id]
        );
        res.status(201).json({ message: 'Blood sample request submitted successfully.' });
    } catch (error) {
        console.error('Request blood sample error:', error);
        res.status(500).json({ message: 'Failed to submit request.' });
    }
};

export const getHospitalRequests = async (req, res) => {
    const hospital_id = req.user.id;
    try {
        const [requests] = await pool.query(`
            SELECT br.id, br.status, br.created_at, bs.blood_group,
                   u.name AS receiver_name, u.email AS receiver_email
            FROM blood_requests br
            JOIN blood_samples bs ON br.sample_id = bs.id
            JOIN users u ON br.receiver_id = u.id
            WHERE bs.hospital_id = ?
            ORDER BY br.created_at DESC
        `, [hospital_id]);
        res.json(requests);
    } catch (error) {
        console.error('Get hospital requests error:', error);
        res.status(500).json({ message: 'Failed to fetch requests.' });
    }
};

export const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const hospital_id = req.user.id;

    const normalizedStatus = status?.toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Status must be APPROVED or REJECTED.' });
    }

    try {
        // FIX: Verify the request belongs to this hospital's samples (prevent cross-hospital access)
        const [requestData] = await pool.query(`
            SELECT br.id, br.status, br.sample_id
            FROM blood_requests br
            JOIN blood_samples bs ON br.sample_id = bs.id
            WHERE br.id = ? AND bs.hospital_id = ?
        `, [id, hospital_id]);

        if (requestData.length === 0) {
            return res.status(404).json({ message: 'Request not found or access denied.' });
        }

        if (requestData[0].status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been processed.' });
        }

        if (normalizedStatus === 'APPROVED') {
            const [samples] = await pool.query(
                'SELECT quantity_ml FROM blood_samples WHERE id = ?',
                [requestData[0].sample_id]
            );
            if (samples[0].quantity_ml < 450) {
                return res.status(400).json({ message: 'Insufficient blood volume to fulfill this request.' });
            }
            await pool.query(
                'UPDATE blood_samples SET quantity_ml = quantity_ml - 450 WHERE id = ?',
                [requestData[0].sample_id]
            );
        }

        await pool.query(
            'UPDATE blood_requests SET status = ? WHERE id = ?',
            [normalizedStatus.toLowerCase(), id]
        );

        res.json({ message: `Request has been ${normalizedStatus.toLowerCase()}.` });
    } catch (error) {
        console.error('Update request status error:', error);
        res.status(500).json({ message: 'Failed to update request status.' });
    }
};
