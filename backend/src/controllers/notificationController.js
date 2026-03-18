const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.user_id]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2',
            [id, req.user.user_id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
