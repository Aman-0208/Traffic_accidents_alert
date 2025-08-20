import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'alert'],
    default: 'inactive'
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  lastProcessed: {
    type: Date
  },
  accidentCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Create indexes
streamSchema.index({ status: 1 });
streamSchema.index({ location: 1 });
streamSchema.index({ coordinates: '2dsphere' });

const Stream = mongoose.model('Stream', streamSchema);

export default Stream;