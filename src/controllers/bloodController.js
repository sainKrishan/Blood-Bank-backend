import pool from '../config/db.js';

export const addBloodSample = async (req, res) => {
    const { blood_group, quantity_ml } = req.body;
    const hospital_id = req.user.id;

    if (!blood_group || !quantity_ml) {
        return res.status(400).json({ message: 'Blood group and quantity are required.' });
    }
    if (quantity_ml <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0.' });
    }

    try {
        await pool.query(
            'INSERT INTO blood_samples (hospital_id, blood_group, quantity_ml) VALUES (?, ?, ?)',
            [hospital_id, blood_group, quantity_ml]
        );
        res.status(201).json({ message: 'Blood sample added successfully.' });
    } catch (error) {
        console.error('Add sample error:', error);
        res.status(500).json({ message: 'Failed to add blood sample.' });
    }
};

export const getAllSamples = async (req, res) => {
    try {
        const [samples] = await pool.query(`
            SELECT bs.id, bs.blood_group, bs.quantity_ml, u.name AS hospital_name, bs.hospital_id
            FROM blood_samples bs
            JOIN users u ON bs.hospital_id = u.id
            WHERE bs.quantity_ml > 0
            ORDER BY bs.created_at DESC
        `);
        res.json(samples);
    } catch (error) {
        console.error('Get all samples error:', error);
        res.status(500).json({ message: 'Failed to retrieve blood samples.' });
    }
};
