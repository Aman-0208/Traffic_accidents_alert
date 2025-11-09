import express from 'express';

const router = express.Router();

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;

    let query = req.supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data: alerts, error } = await query;

    if (error) throw error;
    res.json(alerts || []);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get single alert
router.get('/:id', async (req, res) => {
  try {
    const { data: alert, error } = await req.supabase
      .from('alerts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
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

    const { data: alert, error } = await req.supabase
      .from('alerts')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    req.io.emit('alert-status-updated', alert);

    res.json(alert);
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({ error: 'Failed to update alert status' });
  }
});

// Send alert notification
router.post('/:id/send', async (req, res) => {
  try {
    const { data: alert, error } = await req.supabase
      .from('alerts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    req.io.emit('alert-sent', alert);

    res.json({ message: 'Alert sent successfully', alert });
  } catch (error) {
    console.error('Error sending alert:', error);
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { data: alert, error } = await req.supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    req.io.emit('alert-acknowledged', { alertId: req.params.id });

    res.json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Get alert statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { data: alerts, error } = await req.supabase
      .from('alerts')
      .select('status, severity');

    if (error) throw error;

    const summary = {
      total: alerts.length,
      pending: 0,
      sent: 0,
      acknowledged: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    alerts.forEach(alert => {
      if (alert.status) summary[alert.status] = (summary[alert.status] || 0) + 1;
      if (alert.severity) summary[alert.severity] = (summary[alert.severity] || 0) + 1;
    });

    res.json(summary);
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

export default router;
