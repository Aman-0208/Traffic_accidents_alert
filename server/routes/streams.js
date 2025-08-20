import express from 'express';
import Stream from '../models/Stream.js';
import Alert from '../models/Alert.js';

const router = express.Router();

// Get all streams
router.get('/', async (req, res) => {
  try {
    const streams = await Stream.find().sort({ createdAt: -1 });
    res.json(streams);
  } catch (error) {
    console.error('❌ Error fetching streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get single stream
router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    res.json(stream);
  } catch (error) {
    console.error('❌ Error fetching stream:', error);
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

    const stream = new Stream({
      url: url.trim(),
      location: location.trim(),
      coordinates: coordinates || {},
      status: 'inactive'
    });

    await stream.save();
    
    // Emit to all connected clients
    req.io.emit('stream-created', stream);
    
    res.status(201).json(stream);
  } catch (error) {
    console.error('❌ Error creating stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// Update stream
router.put('/:id', async (req, res) => {
  try {
    const { url, location, coordinates, status } = req.body;
    
    const stream = await Stream.findByIdAndUpdate(
      req.params.id,
      {
        ...(url && { url: url.trim() }),
        ...(location && { location: location.trim() }),
        ...(coordinates && { coordinates }),
        ...(status && { status })
      },
      { new: true, runValidators: true }
    );

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Emit to all connected clients
    req.io.emit('stream-updated', stream);
    
    res.json(stream);
  } catch (error) {
    console.error('❌ Error updating stream:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Delete stream
router.delete('/:id', async (req, res) => {
  try {
    const stream = await Stream.findByIdAndDelete(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Delete associated alerts
    await Alert.deleteMany({ streamId: req.params.id });
    
    // Emit to all connected clients
    req.io.emit('stream-deleted', { id: req.params.id });
    
    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// Start monitoring stream
router.post('/:id/start', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Update stream status
    stream.status = 'active';
    stream.isProcessing = true;
    stream.lastProcessed = new Date();
    await stream.save();

    // Start ML processing
    processStreamWithML(stream, req.mlService, req.io);
    
    // Emit to all connected clients
    req.io.emit('stream-started', stream);
    
    res.json({ message: 'Stream monitoring started', stream });
  } catch (error) {
    console.error('❌ Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream monitoring' });
  }
});

// Stop monitoring stream
router.post('/:id/stop', async (req, res) => {
  try {
    const stream = await Stream.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'inactive',
        isProcessing: false
      },
      { new: true }
    );

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    // Emit to all connected clients
    req.io.emit('stream-stopped', stream);
    
    res.json({ message: 'Stream monitoring stopped', stream });
  } catch (error) {
    console.error('❌ Error stopping stream:', error);
    res.status(500).json({ error: 'Failed to stop stream monitoring' });
  }
});

// Process stream with ML
async function processStreamWithML(stream, mlService, io) {
  const processInterval = setInterval(async () => {
    try {
      // Check if stream is still active
      const currentStream = await Stream.findById(stream._id);
      if (!currentStream || !currentStream.isProcessing) {
        clearInterval(processInterval);
        return;
      }

      // Process video stream
      const result = await mlService.processVideoStream(stream.url);
      
      // Update last processed time
      currentStream.lastProcessed = new Date();
      await currentStream.save();

      // Emit processing result
      io.to(`stream-${stream._id}`).emit('detection-result', {
        streamId: stream._id,
        result
      });

      // If accident detected, create alert
      if (result.accidentDetected) {
        await handleAccidentDetection(stream, result, io);
      }

    } catch (error) {
      console.error('❌ ML processing error:', error);
      
      // Update stream status to error
      await Stream.findByIdAndUpdate(stream._id, { 
        status: 'error',
        isProcessing: false 
      });
      
      clearInterval(processInterval);
    }
  }, 5000); // Process every 5 seconds
}

// Handle accident detection
async function handleAccidentDetection(stream, detectionResult, io) {
  try {
    // Update stream status
    stream.status = 'alert';
    stream.accidentCount += 1;
    await stream.save();

    // Create alert
    const alert = new Alert({
      streamId: stream._id,
      location: stream.location,
      coordinates: stream.coordinates,
      severity: detectionResult.confidence > 0.9 ? 'critical' : 'high',
      detectionData: {
        confidence: detectionResult.confidence,
        boundingBoxes: detectionResult.detections.map(d => ({
          x: d.boundingBox.x,
          y: d.boundingBox.y,
          width: d.boundingBox.width,
          height: d.boundingBox.height,
          class: d.class,
          confidence: d.confidence
        })),
        frameTimestamp: detectionResult.timestamp
      }
    });

    await alert.save();

    // Emit accident alert
    io.emit('accident-detected', {
      alert,
      stream,
      detectionResult
    });

    console.log(`🚨 Accident detected at ${stream.location}`);

  } catch (error) {
    console.error('❌ Error handling accident detection:', error);
  }
}

export default router;