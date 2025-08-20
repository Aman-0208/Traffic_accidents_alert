// Configuration example for TrafficWatch AI
// Copy this file to config.js and update with your actual values

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
  },

  // Database Configuration
  database: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/traffic-surveillance'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // ML Model Configuration
  ml: {
    modelUrl: process.env.ML_MODEL_URL || 'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1'
  },

  // Free APIs Configuration
  apis: {
    // OpenWeatherMap API - Free tier: 1000 calls/day
    // Sign up at: https://openweathermap.org/api
    openweather: {
      apiKey: process.env.OPENWEATHER_API_KEY || 'your-openweather-api-key',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      defaultLocation: 'New York'
    },

    // Unsplash API - Free tier: 5000 requests/hour
    // Sign up at: https://unsplash.com/developers
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY || 'your-unsplash-access-key',
      baseUrl: 'https://api.unsplash.com'
    },

    // MapBox API - Free tier: 50,000 map loads/month
    // Sign up at: https://www.mapbox.com/
    mapbox: {
      accessToken: process.env.MAPBOX_ACCESS_TOKEN || 'your-mapbox-access-token',
      baseUrl: 'https://api.mapbox.com'
    }
  },

  // Sample video streams for testing
  sampleStreams: [
    {
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      location: 'Main Street & 5th Avenue',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    {
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      location: 'Broadway & 42nd Street',
      coordinates: { lat: 40.7561, lng: -73.9865 }
    }
  ],

  // ML Simulation Settings
  simulation: {
    accidentProbability: {
      normal: 0.15,
      rushHour: 0.25,
      badWeather: 0.35
    },
    processingInterval: 5000, // 5 seconds
    detectionClasses: [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
      'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench'
    ]
  }
};

// Environment Variables Setup Guide:
/*
1. Create a .env file in the root directory
2. Add the following variables:

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/traffic-surveillance

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# ML Model Configuration
ML_MODEL_URL=https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1

# Free APIs Configuration
OPENWEATHER_API_KEY=your-openweather-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

3. Get free API keys:
   - OpenWeatherMap: https://openweathermap.org/api (1000 calls/day free)
   - Unsplash: https://unsplash.com/developers (5000 requests/hour free)
   - MapBox: https://www.mapbox.com/ (50,000 map loads/month free)

4. Install MongoDB locally or use MongoDB Atlas (free tier available)
*/ 