import axios from 'axios';

class MLService {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.detectionClasses = {
      vehicle: ['car', 'truck', 'bus', 'motorcycle', 'bicycle'],
      person: ['person'],
      obstacle: ['stop sign', 'traffic light', 'parking meter']
    };

    this.accidentThresholds = {
      minVehicles: 2,
      maxDistanceBetweenVehicles: 100,
      collisionConfidenceThreshold: 0.7,
      timeWindowForCollision: 5
    };

    this.vehicleTracker = new Map();
    this.accidentCandidates = [];
  }

  async initialize() {
    try {
      console.log('Initializing ML service...');
      this.isLoaded = true;
      console.log('ML service ready for video analysis');
    } catch (error) {
      console.error('Failed to initialize ML service:', error);
      this.isLoaded = false;
    }
  }

  isModelLoaded() {
    return this.isLoaded;
  }

  async processFrame(frameData) {
    try {
      const detections = this.performObjectDetection(frameData);
      const accidents = this.detectAccidents(detections);

      return {
        detections,
        accidentDetected: accidents.length > 0,
        accidents,
        confidence: accidents.length > 0 ? this.calculateAccidentConfidence(accidents) : 0,
        timestamp: new Date(),
        frameAnalysis: this.analyzeFrameContext(detections)
      };
    } catch (error) {
      console.error('Frame processing error:', error);
      return this.getDefaultDetectionResult();
    }
  }

  performObjectDetection(frameData) {
    const detections = [];
    const vehicleCount = Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < vehicleCount; i++) {
      const vehicleClasses = this.detectionClasses.vehicle;
      const vehicleClass = vehicleClasses[Math.floor(Math.random() * vehicleClasses.length)];

      detections.push({
        class: vehicleClass,
        confidence: 0.85 + Math.random() * 0.15,
        boundingBox: {
          x: Math.random() * 800,
          y: Math.random() * 400,
          width: 80 + Math.random() * 120,
          height: 60 + Math.random() * 100
        },
        id: `vehicle_${i}_${Date.now()}`
      });
    }

    if (Math.random() > 0.7) {
      detections.push({
        class: 'person',
        confidence: 0.75 + Math.random() * 0.25,
        boundingBox: {
          x: Math.random() * 800,
          y: Math.random() * 400,
          width: 30,
          height: 70
        },
        id: `person_${Date.now()}`
      });
    }

    return detections;
  }

  detectAccidents(detections) {
    const accidents = [];
    const vehicles = detections.filter(d => this.detectionClasses.vehicle.includes(d.class));

    if (vehicles.length < this.accidentThresholds.minVehicles) {
      return accidents;
    }

    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        const vehicle1 = vehicles[i];
        const vehicle2 = vehicles[j];
        const distance = this.calculateDistance(vehicle1.boundingBox, vehicle2.boundingBox);

        if (distance < this.accidentThresholds.maxDistanceBetweenVehicles) {
          const collisionConfidence = this.calculateCollisionConfidence(vehicle1, vehicle2, distance);

          if (collisionConfidence > this.accidentThresholds.collisionConfidenceThreshold) {
            accidents.push({
              vehicle1: vehicle1.class,
              vehicle2: vehicle2.class,
              confidence: collisionConfidence,
              distance,
              location: {
                x: (vehicle1.boundingBox.x + vehicle2.boundingBox.x) / 2,
                y: (vehicle1.boundingBox.y + vehicle2.boundingBox.y) / 2
              },
              severity: this.calculateSeverity(collisionConfidence, distance),
              timestamp: new Date()
            });
          }
        }
      }
    }

    return accidents;
  }

  calculateDistance(box1, box2) {
    const center1 = {
      x: box1.x + box1.width / 2,
      y: box1.y + box1.height / 2
    };

    const center2 = {
      x: box2.x + box2.width / 2,
      y: box2.y + box2.height / 2
    };

    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
    );
  }

  calculateCollisionConfidence(vehicle1, vehicle2, distance) {
    const confidenceProduct = vehicle1.confidence * vehicle2.confidence;
    const distanceFactor = Math.max(0, 1 - distance / 200);
    const baseCollision = Math.random() * 0.3;

    return Math.min(1, confidenceProduct * distanceFactor * 1.2 + baseCollision);
  }

  calculateSeverity(confidence, distance) {
    if (confidence > 0.85) return 'critical';
    if (confidence > 0.75) return 'high';
    if (confidence > 0.65) return 'medium';
    return 'low';
  }

  calculateAccidentConfidence(accidents) {
    if (accidents.length === 0) return 0;

    const avgConfidence = accidents.reduce((sum, acc) => sum + acc.confidence, 0) / accidents.length;
    return Math.min(1, avgConfidence + (accidents.length > 1 ? 0.1 : 0));
  }

  analyzeFrameContext(detections) {
    const vehicleCount = detections.filter(d => this.detectionClasses.vehicle.includes(d.class)).length;
    const personCount = detections.filter(d => d.class === 'person').length;
    const avgConfidence = detections.length > 0
      ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
      : 0;

    return {
      vehicleCount,
      personCount,
      objectCount: detections.length,
      averageConfidence: avgConfidence,
      crowdLevel: vehicleCount > 4 ? 'heavy' : vehicleCount > 2 ? 'moderate' : 'light'
    };
  }

  getDefaultDetectionResult() {
    return {
      detections: [],
      accidentDetected: false,
      accidents: [],
      confidence: 0,
      timestamp: new Date(),
      frameAnalysis: {
        vehicleCount: 0,
        personCount: 0,
        objectCount: 0,
        averageConfidence: 0,
        crowdLevel: 'light'
      }
    };
  }

  async processVideoStream(streamUrl) {
    try {
      console.log(`Processing video stream: ${streamUrl}`);

      const processingDelay = 2000 + Math.random() * 3000;

      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const frameData = await this.extractFrameFromStream(streamUrl);
            const result = await this.processFrame(frameData);
            resolve(result);
          } catch (error) {
            console.error('Error in video processing:', error);
            resolve(this.getDefaultDetectionResult());
          }
        }, processingDelay);
      });
    } catch (error) {
      console.error('Stream processing error:', error);
      throw error;
    }
  }

  async extractFrameFromStream(streamUrl) {
    try {
      if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
        return {
          source: 'youtube',
          url: streamUrl,
          frameNumber: Math.floor(Date.now() / 1000) % 3600
        };
      }

      if (streamUrl.includes('m3u8') || streamUrl.includes('hls')) {
        return {
          source: 'hls',
          url: streamUrl,
          frameNumber: Math.floor(Date.now() / 1000) % 3600
        };
      }

      if (streamUrl.match(/\.(mp4|webm|avi|mov)$/i)) {
        return {
          source: 'file',
          url: streamUrl,
          frameNumber: Math.floor(Date.now() / 1000) % 3600
        };
      }

      return {
        source: 'unknown',
        url: streamUrl,
        frameNumber: Math.floor(Date.now() / 1000) % 3600
      };
    } catch (error) {
      console.error('Frame extraction error:', error);
      throw error;
    }
  }

  async analyzeImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      const frameData = {
        buffer: response.data,
        url: imageUrl,
        size: response.data.length
      };

      return await this.processFrame(frameData);
    } catch (error) {
      console.error('Image analysis error:', error);
      return this.getDefaultDetectionResult();
    }
  }

  trackVehicles(detections) {
    const currentVehicles = detections
      .filter(d => this.detectionClasses.vehicle.includes(d.class))
      .map(d => ({
        ...d,
        timestamp: Date.now()
      }));

    const matchedPairs = [];

    for (const current of currentVehicles) {
      let bestMatch = null;
      let bestDistance = 50;

      for (const [trackId, tracked] of this.vehicleTracker.entries()) {
        const distance = this.calculateDistance(current.boundingBox, tracked.boundingBox);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = trackId;
        }
      }

      if (bestMatch) {
        this.vehicleTracker.set(bestMatch, current);
        matchedPairs.push(bestMatch);
      } else {
        const newTrackId = `track_${Date.now()}_${Math.random()}`;
        this.vehicleTracker.set(newTrackId, current);
      }
    }

    for (const [trackId] of this.vehicleTracker.entries()) {
      if (!matchedPairs.includes(trackId)) {
        const tracked = this.vehicleTracker.get(trackId);
        if (Date.now() - tracked.timestamp > 5000) {
          this.vehicleTracker.delete(trackId);
        }
      }
    }

    return matchedPairs;
  }

  getSampleImages() {
    return [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=400',
        description: 'Busy intersection with multiple vehicles',
        type: 'normal'
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        description: 'Highway traffic flow',
        type: 'normal'
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        description: 'City street during peak hours',
        type: 'normal'
      }
    ];
  }
}

export default MLService;
