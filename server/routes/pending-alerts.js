import express from 'express';

const router = express.Router();

// Get all pending accident detections
router.get('/', async (req, res) => {
  try {
    const { status, stream_id, limit = 50 } = req.query;

    let query = req.supabase
      .from('pending_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) query = query.eq('status', status);
    if (stream_id) query = query.eq('stream_id', stream_id);

    const { data: alerts, error } = await query;

    if (error) throw error;
    res.json(alerts || []);
  } catch (error) {
    console.error('Error fetching pending alerts:', error);
    res.status(500).json({ error: 'Failed to fetch pending alerts' });
  }
});

// Get single pending alert
router.get('/:id', async (req, res) => {
  try {
    const { data: alert, error } = await req.supabase
      .from('pending_alerts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Pending alert not found' });
    }
    res.json(alert);
  } catch (error) {
    console.error('Error fetching pending alert:', error);
    res.status(500).json({ error: 'Failed to fetch pending alert' });
  }
});

// Create pending alert from accident detection
router.post('/', async (req, res) => {
  try {
    const { stream_id, detection_data, frame_timestamp, confidence } = req.body;

    if (!stream_id || !detection_data) {
      return res.status(400).json({ error: 'Stream ID and detection data are required' });
    }

    const { data: alert, error } = await req.supabase
      .from('pending_alerts')
      .insert([{
        stream_id,
        detection_data,
        frame_timestamp: frame_timestamp || new Date().toISOString(),
        confidence: confidence || 0.75,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    req.io.emit('pending-alert-created', alert);

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating pending alert:', error);
    res.status(500).json({ error: 'Failed to create pending alert' });
  }
});

// Approve pending alert (converts to final alert)
router.post('/:id/approve', async (req, res) => {
  try {
    const { approved_by } = req.body;

    const { data: pendingAlert, error: fetchError } = await req.supabase
      .from('pending_alerts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!pendingAlert) {
      return res.status(404).json({ error: 'Pending alert not found' });
    }

    // Update pending alert status
    const { error: updateError } = await req.supabase
      .from('pending_alerts')
      .update({
        status: 'approved',
        approved_by: approved_by || 'system',
        approved_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Create final alert
    const alertData = {
      stream_id: pendingAlert.stream_id,
      location: pendingAlert.detection_data.location || 'Unknown',
      latitude: pendingAlert.detection_data.latitude,
      longitude: pendingAlert.detection_data.longitude,
      severity: pendingAlert.detection_data.severity || 'high',
      type: 'accident',
      status: 'sent',
      confidence: pendingAlert.confidence,
      detection_data: pendingAlert.detection_data,
      description: `Accident detected with ${pendingAlert.confidence.toFixed(2)} confidence`,
      sent_at: new Date().toISOString()
    };

    const { data: finalAlert, error: alertError } = await req.supabase
      .from('alerts')
      .insert([alertData])
      .select()
      .single();

    if (alertError) throw alertError;

    // Update stream status
    await req.supabase
      .from('streams')
      .update({
        status: 'alert',
        accident_count: pendingAlert.detection_data.accident_count || 1
      })
      .eq('id', pendingAlert.stream_id);

    req.io.emit('alert-approved', {
      pendingAlertId: req.params.id,
      finalAlert
    });

    res.json({
      message: 'Alert approved and created',
      pendingAlert,
      finalAlert
    });
  } catch (error) {
    console.error('Error approving pending alert:', error);
    res.status(500).json({ error: 'Failed to approve pending alert' });
  }
});

// Reject pending alert
router.post('/:id/reject', async (req, res) => {
  try {
    const { rejection_reason, approved_by } = req.body;

    const { data: alert, error } = await req.supabase
      .from('pending_alerts')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason || 'User rejected',
        approved_by: approved_by || 'system',
        approved_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!alert) {
      return res.status(404).json({ error: 'Pending alert not found' });
    }

    req.io.emit('alert-rejected', alert);

    res.json({ message: 'Alert rejected', alert });
  } catch (error) {
    console.error('Error rejecting pending alert:', error);
    res.status(500).json({ error: 'Failed to reject pending alert' });
  }
});

// Get pending alerts count
router.get('/stats/pending-count', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('pending_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;

    res.json({
      pendingCount: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching pending alerts count:', error);
    res.status(500).json({ error: 'Failed to fetch pending alerts count' });
  }
});

export default router;
