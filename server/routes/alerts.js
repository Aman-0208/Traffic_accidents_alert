import express from 'express';
import Alert from '../models/Alert.js';

const router = express.Router();

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(alerts);
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get single alert
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    console.error('❌ Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Update alert status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Emit to all connected clients
    req.io.emit('alert-status-updated', alert);
    
    res.json(alert);
  } catch (error) {
    console.error('❌ Error updating alert status:', error);
    res.status(500).json({ error: 'Failed to update alert status' });
  }
});

// Send alert notification
router.post('/:id/send', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Update alert status to sent
    alert.status = 'sent';
    alert.sentAt = new Date();
    await alert.save();

    // Emit to all connected clients
    req.io.emit('alert-sent', alert);
    
    res.json({ message: 'Alert sent successfully', alert });
  } catch (error) {
    console.error('❌ Error sending alert:', error);
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'acknowledged',
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Emit to all connected clients
    req.io.emit('alert-acknowledged', { alertId: req.params.id });
    
    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    console.error('❌ Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Get alert statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      pending: 0,
      sent: 0,
      acknowledged: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      summary.total += stat.count;
    });

    // Get severity stats
    const severityStats = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    severityStats.forEach(stat => {
      if (summary.hasOwnProperty(stat._id)) {
        summary[stat._id] = stat.count;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching alert stats:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

export default router;