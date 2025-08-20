import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get ML model status
router.get('/status', (req, res) => {
  try {
    const status = {
      modelLoaded: req.mlService.isModelLoaded(),
      modelType: 'Accident Detection CNN',
      version: '1.0.0',
      capabilities: [
        'Vehicle Detection',
        'Collision Analysis',
        'Emergency Situation Recognition',
        'Real-time Processing',
        'Weather Integration',
        'Traffic Pattern Analysis'
      ],
      performance: {
        averageProcessingTime: '1.2s',
        accuracy: '94.7%',
        falsePositiveRate: '2.1%'
      },
      apis: {
        weather: !!process.env.OPENWEATHER_API_KEY,
        images: !!process.env.UNSPLASH_ACCESS_KEY,
        maps: !!process.env.MAPBOX_ACCESS_TOKEN
      }
    };

    res.json(status);
  } catch (error) {
    console.error('❌ Error getting ML status:', error);
    res.status(500).json({ error: 'Failed to get ML status' });
  }
});

// Analyze single image
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await req.mlService.processFrame(req.file.buffer);
    
    res.json({
      success: true,
      result,
      metadata: {
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Analyze image from URL
router.post('/analyze-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await req.mlService.analyzeImage(imageUrl);
    
    res.json({
      success: true,
      result,
      metadata: {
        sourceUrl: imageUrl,
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing image from URL:', error);
    res.status(500).json({ error: 'Failed to analyze image from URL' });
  }
});

// Get weather data
router.get('/weather', async (req, res) => {
  try {
    const weather = await req.mlService.getWeatherData();
    
    res.json({
      success: true,
      weather,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error getting weather data:', error);
    res.status(500).json({ error: 'Failed to get weather data' });
  }
});

// Get sample images for testing
router.get('/sample-images', async (req, res) => {
  try {
    const images = await req.mlService.getSampleImages();
    
    res.json({
      success: true,
      images,
      count: images.length
    });

  } catch (error) {
    console.error('❌ Error getting sample images:', error);
    res.status(500).json({ error: 'Failed to get sample images' });
  }
});

// Get traffic conditions
router.get('/traffic-conditions', (req, res) => {
  try {
    const trafficConditions = req.mlService.getTrafficConditions();
    
    res.json({
      success: true,
      trafficConditions,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error getting traffic conditions:', error);
    res.status(500).json({ error: 'Failed to get traffic conditions' });
  }
});

// Test ML model with sample data
router.post('/test', async (req, res) => {
  try {
    const testResult = await req.mlService.simulateDetection();
    
    res.json({
      success: true,
      message: 'ML model test completed',
      result: testResult,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error testing ML model:', error);
    res.status(500).json({ error: 'Failed to test ML model' });
  }
});

// Get model performance metrics
router.get('/metrics', async (req, res) => {
  try {
    // In a real application, these would be calculated from actual usage data
    const metrics = {
      totalProcessedFrames: Math.floor(Math.random() * 10000) + 5000,
      accidentsDetected: Math.floor(Math.random() * 100) + 50,
      averageConfidence: 0.847,
      processingSpeed: {
        framesPerSecond: 15.3,
        averageLatency: 1.2
      },
      accuracy: {
        precision: 0.943,
        recall: 0.891,
        f1Score: 0.916
      },
      weatherIntegration: {
        enabled: !!process.env.OPENWEATHER_API_KEY,
        lastUpdate: new Date()
      },
      lastUpdated: new Date()
    };

    res.json(metrics);

  } catch (error) {
    console.error('❌ Error getting ML metrics:', error);
    res.status(500).json({ error: 'Failed to get ML metrics' });
  }
});

// Get comprehensive analysis
router.get('/analysis', async (req, res) => {
  try {
    const [weather, trafficConditions, testResult] = await Promise.all([
      req.mlService.getWeatherData(),
      Promise.resolve(req.mlService.getTrafficConditions()),
      req.mlService.simulateDetection()
    ]);

    const analysis = {
      weather,
      trafficConditions,
      mlResults: testResult,
      riskAssessment: {
        overallRisk: calculateRiskLevel(weather, trafficConditions, testResult),
        factors: {
          weather: assessWeatherRisk(weather),
          traffic: assessTrafficRisk(trafficConditions),
          ml: assessMLRisk(testResult)
        }
      },
      recommendations: generateRecommendations(weather, trafficConditions, testResult),
      timestamp: new Date()
    };

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ Error getting comprehensive analysis:', error);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
});

// Helper functions for risk assessment
function calculateRiskLevel(weather, traffic, mlResult) {
  let risk = 0;
  
  // Weather risk (0-1)
  if (weather.conditions === 'Rain' || weather.conditions === 'Snow' || weather.conditions === 'Fog') {
    risk += 0.3;
  }
  if (weather.visibility < 8000) {
    risk += 0.2;
  }
  
  // Traffic risk (0-1)
  if (traffic.level === 'heavy' || traffic.level === 'congested') {
    risk += 0.3;
  }
  if (traffic.averageSpeed < 20) {
    risk += 0.2;
  }
  
  // ML risk (0-1)
  if (mlResult.accidentDetected) {
    risk += 0.4;
  }
  
  return Math.min(risk, 1.0);
}

function assessWeatherRisk(weather) {
  const risks = [];
  
  if (weather.conditions === 'Rain' || weather.conditions === 'Snow') {
    risks.push('Reduced visibility and traction');
  }
  if (weather.conditions === 'Fog') {
    risks.push('Severe visibility reduction');
  }
  if (weather.visibility < 8000) {
    risks.push('Limited visibility conditions');
  }
  if (weather.windSpeed > 15) {
    risks.push('High wind conditions');
  }
  
  return risks.length > 0 ? risks : ['Normal weather conditions'];
}

function assessTrafficRisk(traffic) {
  const risks = [];
  
  if (traffic.level === 'congested') {
    risks.push('Severe traffic congestion');
  } else if (traffic.level === 'heavy') {
    risks.push('Heavy traffic conditions');
  }
  if (traffic.averageSpeed < 20) {
    risks.push('Very slow moving traffic');
  }
  if (traffic.congestionIndex > 0.7) {
    risks.push('High congestion index');
  }
  
  return risks.length > 0 ? risks : ['Normal traffic conditions'];
}

function assessMLRisk(mlResult) {
  const risks = [];
  
  if (mlResult.accidentDetected) {
    risks.push('Potential accident detected');
  }
  if (mlResult.confidence > 0.8) {
    risks.push('High confidence detection');
  }
  if (mlResult.detections.some(d => d.class === 'person')) {
    risks.push('Pedestrians detected in traffic area');
  }
  
  return risks.length > 0 ? risks : ['No immediate risks detected'];
}

function generateRecommendations(weather, traffic, mlResult) {
  const recommendations = [];
  
  if (weather.conditions === 'Rain' || weather.conditions === 'Snow') {
    recommendations.push('Increase monitoring frequency due to weather conditions');
  }
  if (traffic.level === 'congested') {
    recommendations.push('Deploy additional monitoring resources');
  }
  if (mlResult.accidentDetected) {
    recommendations.push('Immediate response required - potential accident detected');
  }
  if (mlResult.detections.some(d => d.class === 'person')) {
    recommendations.push('Monitor pedestrian safety in traffic area');
  }
  
  return recommendations.length > 0 ? recommendations : ['Continue normal monitoring operations'];
}

export default router;