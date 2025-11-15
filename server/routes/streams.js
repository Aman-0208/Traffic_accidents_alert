import express from 'express';

const router = express.Router();

// Get all streams
router.get('/', async (req, res) => {
  try {
    const { data: streams, error } = await req.supabase
      .from('streams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(streams || []);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get single stream
router.get('/:id', async (req, res) => {
  try {
    const { data: stream, error } = await req.supabase
      .from('streams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    res.json(stream);
  } catch (error) {
    console.error('Error fetching stream:', error);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

// Create new stream
router.post('/', async (req, res) => {
  try {
    const { url, location, coordinates } = req.body;

    if (!url || !location) {
      return res.status(400).json({ error: 'URL and location are required' });
    }

    const streamData = {
      url: url.trim(),
      location: location.trim(),
      latitude: coordinates?.latitude || null,
      longitude: coordinates?.longitude || null,
      status: 'inactive'
    };

    const { data: stream, error } = await req.supabase
      .from('streams')
      .insert([streamData])
      .select()
      .single();

    if (error) throw error;

    req.io.emit('stream-created', stream);

    res.status(201).json(stream);
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Update stream
router.put('/:id', async (req, res) => {
  try {
    const { url, location, coordinates, status } = req.body;

    const updateData = {};
    if (url) updateData.url = url.trim();
    if (location) updateData.location = location.trim();
    if (coordinates?.latitude) updateData.latitude = coordinates.latitude;
    if (coordinates?.longitude) updateData.longitude = coordinates.longitude;
    if (status) updateData.status = status;

    const { data: stream, error } = await req.supabase
      .from('streams')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    req.io.emit('stream-updated', stream);

    res.json(stream);
  } catch (error) {
    console.error('Error updating stream:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Delete stream
router.delete('/:id', async (req, res) => {
  try {
    const { error: deleteError } = await req.supabase
      .from('streams')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    req.io.emit('stream-deleted', { id: req.params.id });

    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// Start monitoring stream
router.post('/:id/start', async (req, res) => {
  try {
    const { data: stream, error } = await req.supabase
      .from('streams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const { data: updatedStream, error: updateError } = await req.supabase
      .from('streams')
      .update({
        status: 'active',
        is_processing: true,
        last_processed: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    processStreamWithML(updatedStream, req.mlService, req.io, req.supabase);

    req.io.emit('stream-started', updatedStream);

    res.json({ message: 'Stream monitoring started', stream: updatedStream });
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream monitoring' });
  }
});

// Stop monitoring stream
router.post('/:id/stop', async (req, res) => {
  try {
    const { data: stream, error } = await req.supabase
      .from('streams')
      .update({
        status: 'inactive',
        is_processing: false
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    req.io.emit('stream-stopped', stream);

    res.json({ message: 'Stream monitoring stopped', stream });
  } catch (error) {
    console.error('Error stopping stream:', error);
    res.status(500).json({ error: 'Failed to stop stream monitoring' });
  }
});

// Process stream with ML
async function processStreamWithML(stream, mlService, io, supabase) {
  const processInterval = setInterval(async () => {
    try {
      const { data: currentStream, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', stream.id)
        .single();

      if (error || !currentStream || !currentStream.is_processing) {
        clearInterval(processInterval);
        return;
      }

      const result = await mlService.processVideoStream(stream.url);

      await supabase
        .from('streams')
        .update({ last_processed: new Date().toISOString() })
        .eq('id', stream.id);

      io.to(`stream-${stream.id}`).emit('detection-result', {
        streamId: stream.id,
        result
      });

      if (result.accidentDetected) {
        await handleAccidentDetection(stream, result, io, supabase);
      }

    } catch (error) {
      console.error('ML processing error:', error);

      await supabase
        .from('streams')
        .update({
          status: 'error',
          is_processing: false
        })
        .eq('id', stream.id);

      clearInterval(processInterval);
    }
  }, 5000);
}

// Handle accident detection - create pending alert for approval
async function handleAccidentDetection(stream, detectionResult, io, supabase) {
  try {
    const detectionData = {
      accidents: detectionResult.accidents,
      vehicles: detectionResult.frameAnalysis,
      frameTimestamp: detectionResult.timestamp,
      location: stream.location,
      latitude: stream.latitude,
      longitude: stream.longitude,
      severity: detectionResult.confidence > 0.85 ? 'critical' : detectionResult.confidence > 0.75 ? 'high' : 'medium',
      boundingBoxes: detectionResult.detections.map(d => ({
        x: d.boundingBox.x,
        y: d.boundingBox.y,
        width: d.boundingBox.width,
        height: d.boundingBox.height,
        class: d.class,
        confidence: d.confidence
      }))
    };

    const { data: pendingAlert } = await supabase
      .from('pending_alerts')
      .insert([{
        stream_id: stream.id,
        detection_data: detectionData,
        frame_timestamp: detectionResult.timestamp.toISOString(),
        confidence: detectionResult.confidence,
        status: 'pending'
      }])
      .select()
      .single();

    io.emit('accident-detected-pending', {
      pendingAlert,
      stream,
      detectionResult
    });

    console.log(`Accident detected at ${stream.location} - awaiting approval`);

  } catch (error) {
    console.error('Error handling accident detection:', error);
  }
}

export default router;
