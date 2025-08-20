import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  streamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'acknowledged', 'resolved'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['accident', 'traffic_jam', 'weather', 'system'],
    default: 'accident'
  },
  detectionData: {
    confidence: Number,
    boundingBoxes: [{
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      class: String,
      confidence: Number
    }],
    frameTimestamp: Date
  },
  description: {
    type: String,
    trim: true
  },
  sentAt: {
    type: Date
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes
alertSchema.index({ status: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ coordinates: '2dsphere' });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;