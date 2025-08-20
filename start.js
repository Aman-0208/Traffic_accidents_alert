#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 TrafficWatch AI - Startup Script');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating default configuration...');
  
  const defaultEnv = `# Server Configuration
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

# Free APIs Configuration (Optional but recommended)
# Get free API keys from:
# - OpenWeatherMap: https://openweathermap.org/api
# - Unsplash: https://unsplash.com/developers
# - MapBox: https://www.mapbox.com/
OPENWEATHER_API_KEY=your-openweather-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
`;

  fs.writeFileSync(envPath, defaultEnv);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 Please update the API keys in .env file for full functionality\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  
  const install = spawn('npm', ['install'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies installed successfully\n');
      startApplication();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  console.log('✅ Dependencies already installed\n');
  startApplication();
}

function startApplication() {
  console.log('🚀 Starting TrafficWatch AI...\n');
  
  // Check if MongoDB is running (optional check)
  console.log('📋 Prerequisites Check:');
  console.log('   - Node.js: ✅ Available');
  console.log('   - Dependencies: ✅ Installed');
  console.log('   - Environment: ✅ Configured');
  console.log('   - MongoDB: ⚠️  Please ensure MongoDB is running');
  console.log('     (Use MongoDB Atlas or local installation)\n');
  
  console.log('🌐 Starting both frontend and backend servers...\n');
  
  const devFull = spawn('npm', ['run', 'dev:full'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  devFull.on('close', (code) => {
    if (code !== 0) {
      console.log('\n❌ Application stopped with error code:', code);
    } else {
      console.log('\n✅ Application stopped successfully');
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down TrafficWatch AI...');
    devFull.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down TrafficWatch AI...');
    devFull.kill('SIGTERM');
    process.exit(0);
  });
}

// Display helpful information
setTimeout(() => {
  console.log('\n📖 Quick Start Guide:');
  console.log('   1. Frontend will be available at: http://localhost:5173');
  console.log('   2. Backend API will be available at: http://localhost:5000');
  console.log('   3. Health check: http://localhost:5000/api/health');
  console.log('   4. Press Ctrl+C to stop the application\n');
  
  console.log('🎯 Next Steps:');
  console.log('   - Add video streams using the "Add Stream" button');
  console.log('   - Start monitoring streams to see AI detection in action');
  console.log('   - Switch to "AI Analytics" tab for comprehensive analysis');
  console.log('   - Get free API keys for weather and mapping features\n');
  
  console.log('📚 For more information, see README.md\n');
}, 2000); 