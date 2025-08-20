import axios from 'axios';

class MLService {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.classes = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
      'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench'
    ];
    this.accidentKeywords = ['accident', 'crash', 'collision', 'emergency'];
    
    // Free API configurations
    this.unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.openweatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  }

  async initialize() {
    try {
      console.log('🤖 Initializing ML service...');
      
      // For now, we'll use simulation mode since TensorFlow.js Node.js bindings
      // require complex setup on Windows. The system will work perfectly with
      // simulated data and can be enhanced later with real ML models.
      this.isLoaded = false;
      console.log('✅ ML service initialized in simulation mode');
      console.log('💡 To enable real ML processing, install TensorFlow.js with proper build tools');
      
    } catch (error) {
      console.error('❌ Failed to initialize ML service:', error);
      this.isLoaded = false;
    }
  }

  isModelLoaded() {
    return this.isLoaded;
  }

  async processFrame(imageBuffer) {
    try {
      // Always use simulation mode for now
      return await this.simulateDetection();
      
    } catch (error) {
      console.error('❌ Frame processing error:', error);
      return this.simulateDetection();
    }
  }

  async simulateDetection() {
    // Enhanced simulation mode with more realistic patterns
    const timeOfDay = new Date().getHours();
    const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);
    
    // Higher accident probability during rush hours
    const baseAccidentProbability = isRushHour ? 0.25 : 0.15;
    const accidentDetected = Math.random() < baseAccidentProbability;
    
    const detections = [
      {
        class: 'car',
        confidence: 0.92 + Math.random() * 0.08,
        boundingBox: { x: 100, y: 150, width: 200, height: 120 }
      },
      {
        class: 'truck',
        confidence: 0.88 + Math.random() * 0.12,
        boundingBox: { x: 350, y: 180, width: 180, height: 140 }
      }
    ];

    // Add more vehicles during rush hour
    if (isRushHour && Math.random() > 0.5) {
      detections.push({
        class: 'bus',
        confidence: 0.85 + Math.random() * 0.15,
        boundingBox: { x: 550, y: 200, width: 220, height: 160 }
      });
    }

    // Add pedestrians occasionally
    if (Math.random() > 0.7) {
      detections.push({
        class: 'person',
        confidence: 0.75 + Math.random() * 0.25,
        boundingBox: { x: 50, y: 300, width: 40, height: 80 }
      });
    }
    
    return {
      detections,
      accidentDetected,
      confidence: accidentDetected ? 0.75 + Math.random() * 0.25 : Math.random() * 0.6,
      timestamp: new Date(),
      simulation: true,
      weather: await this.getWeatherData(),
      trafficConditions: this.getTrafficConditions()
    };
  }

  async getWeatherData() {
    try {
      if (!this.openweatherApiKey) {
        return this.getSimulatedWeatherData();
      }

      // Use a default location (New York) for demo
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=New York&appid=${this.openweatherApiKey}&units=metric`
      );

      return {
        temperature: response.data.main.temp,
        conditions: response.data.weather[0].main,
        visibility: response.data.visibility,
        windSpeed: response.data.wind.speed
      };
    } catch (error) {
      console.log('⚠️ Using simulated weather data');
      return this.getSimulatedWeatherData();
    }
  }

  getSimulatedWeatherData() {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Fog'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: Math.floor(Math.random() * 30) - 5, // -5 to 25°C
      conditions: randomCondition,
      visibility: Math.floor(Math.random() * 10000) + 5000, // 5-15km
      windSpeed: Math.random() * 20 // 0-20 m/s
    };
  }

  getTrafficConditions() {
    const conditions = ['light', 'moderate', 'heavy', 'congested'];
    const timeOfDay = new Date().getHours();
    
    // Determine traffic based on time
    let trafficLevel;
    if (timeOfDay >= 7 && timeOfDay <= 9) {
      trafficLevel = 'heavy';
    } else if (timeOfDay >= 17 && timeOfDay <= 19) {
      trafficLevel = 'congested';
    } else if (timeOfDay >= 22 || timeOfDay <= 5) {
      trafficLevel = 'light';
    } else {
      trafficLevel = conditions[Math.floor(Math.random() * conditions.length)];
    }
    
    return {
      level: trafficLevel,
      averageSpeed: this.getAverageSpeed(trafficLevel),
      congestionIndex: this.getCongestionIndex(trafficLevel)
    };
  }

  getAverageSpeed(trafficLevel) {
    const speeds = {
      light: 45 + Math.random() * 15, // 45-60 mph
      moderate: 30 + Math.random() * 15, // 30-45 mph
      heavy: 15 + Math.random() * 15, // 15-30 mph
      congested: 5 + Math.random() * 10 // 5-15 mph
    };
    return speeds[trafficLevel] || 30;
  }

  getCongestionIndex(trafficLevel) {
    const indices = {
      light: 0.1 + Math.random() * 0.2, // 0.1-0.3
      moderate: 0.3 + Math.random() * 0.3, // 0.3-0.6
      heavy: 0.6 + Math.random() * 0.3, // 0.6-0.9
      congested: 0.8 + Math.random() * 0.2 // 0.8-1.0
    };
    return indices[trafficLevel] || 0.5;
  }

  async processVideoStream(streamUrl) {
    try {
      console.log(`🎥 Processing stream: ${streamUrl}`);
      
      // Simulate processing delay
      const processingTime = 1000 + Math.random() * 2000;
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await this.simulateDetection();
          resolve(result);
        }, processingTime);
      });
      
    } catch (error) {
      console.error('❌ Stream processing error:', error);
      throw error;
    }
  }

  async analyzeImage(imageUrl) {
    try {
      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      
      // Process the image
      return await this.processFrame(imageBuffer);
      
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      return this.simulateDetection();
    }
  }

  async getSampleImages() {
    try {
      if (!this.unsplashApiKey) {
        return this.getSimulatedSampleImages();
      }

      const response = await axios.get(
        `https://api.unsplash.com/photos/random?query=traffic&count=5&client_id=${this.unsplashApiKey}`
      );

      return response.data.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        description: photo.description || 'Traffic scene',
        photographer: photo.user.name
      }));
    } catch (error) {
      console.log('⚠️ Using simulated sample images');
      return this.getSimulatedSampleImages();
    }
  }

  getSimulatedSampleImages() {
    return [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=400',
        description: 'Busy intersection',
        photographer: 'Simulated'
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
        description: 'Highway traffic',
        photographer: 'Simulated'
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        description: 'City street',
        photographer: 'Simulated'
      }
    ];
  }
}

export default MLService;