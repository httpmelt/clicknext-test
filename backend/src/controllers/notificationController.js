const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await pool.query(
            'SELECT "notificationId", "userId", message, "isRead", "createdAt" FROM "Notifications" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
            [req.user.userId]
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
            'UPDATE "Notifications" SET "isRead" = TRUE WHERE "notificationId" = $1 AND "userId" = $2',
            [id, req.user.userId]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
