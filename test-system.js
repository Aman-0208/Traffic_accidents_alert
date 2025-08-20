#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 TrafficWatch AI - System Test');
console.log('==================================\n');

const BASE_URL = 'http://localhost:5000/api';
let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, testFunction) {
  try {
    console.log(`🔍 Testing: ${name}`);
    await testFunction();
    console.log(`✅ PASS: ${name}\n`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}\n`);
    testsFailed++;
  }
}

async function testServerHealth() {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const data = response.data;
  if (!data.status || data.status !== 'OK') {
    throw new Error('Health check status is not OK');
  }
  
  console.log(`   Server uptime: ${Math.floor(data.uptime)}s`);
  console.log(`   ML Model loaded: ${data.mlModelLoaded}`);
}

async function testMLStatus() {
  const response = await axios.get(`${BASE_URL}/ml/status`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const data = response.data;
  console.log(`   Model loaded: ${data.modelLoaded}`);
  console.log(`   Model type: ${data.modelType}`);
  console.log(`   Version: ${data.version}`);
}

async function testMLTest() {
  const response = await axios.post(`${BASE_URL}/ml/test`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const data = response.data;
  if (!data.success) {
    throw new Error('ML test was not successful');
  }
  
  console.log(`   Test result: ${data.message}`);
  console.log(`   Accident detected: ${data.result.accidentDetected}`);
  console.log(`   Confidence: ${(data.result.confidence * 100).toFixed(1)}%`);
}

async function testWeatherData() {
  const response = await axios.get(`${BASE_URL}/ml/weather`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const data = response.data;
  if (!data.success) {
    throw new Error('Weather data request was not successful');
  }
  
  const weather = data.weather;
  console.log(`   Temperature: ${weather.temperature}°C`);
  console.log(`   Conditions: ${weather.conditions}`);
  console.log(`   Visibility: ${(weather.visibility / 1000).toFixed(1)} km`);
}

async function testTrafficConditions() {
  const response = await axios.get(`${BASE_URL}/ml/traffic-conditions`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const data = response.data;
  if (!data.success) {
    throw new Error('Traffic conditions request was not successful');
  }
  
  const traffic = data.trafficConditions;
  console.log(`   Level: ${traffic.level}`);
  console.log(`   Average speed: ${traffic.averageSpeed.toFixed(0)} mph`);
  console.log(`   Congestion: ${(traffic.congestionIndex * 100).toFixed(0)}%`);
}

async function testComprehensiveAnalysis() {
  const response = await axios.get(`${BASE_URL}/ml/analysis`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const data = response.data;
  if (!data.success) {
    throw new Error('Comprehensive analysis request was not successful');
  }
  
  const analysis = data.analysis;
  console.log(`   Overall risk: ${(analysis.riskAssessment.overallRisk * 100).toFixed(1)}%`);
  console.log(`   Recommendations: ${analysis.recommendations.length}`);
}

async function testStreamsAPI() {
  const response = await axios.get(`${BASE_URL}/streams`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const streams = response.data;
  console.log(`   Streams found: ${streams.length}`);
}

async function testAlertsAPI() {
  const response = await axios.get(`${BASE_URL}/alerts`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const alerts = response.data;
  console.log(`   Alerts found: ${alerts.length}`);
}

async function testEnvironmentVariables() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
  
  console.log('   Environment file: ✅ Found');
  console.log('   Required variables: ✅ Present');
}

async function runAllTests() {
  console.log('🚀 Starting system tests...\n');
  
  // Test environment setup
  await runTest('Environment Variables', testEnvironmentVariables);
  
  // Test server connectivity
  await runTest('Server Health Check', testServerHealth);
  
  // Test ML functionality
  await runTest('ML Service Status', testMLStatus);
  await runTest('ML Model Test', testMLTest);
  await runTest('Weather Data API', testWeatherData);
  await runTest('Traffic Conditions API', testTrafficConditions);
  await runTest('Comprehensive Analysis', testComprehensiveAnalysis);
  
  // Test core APIs
  await runTest('Streams API', testStreamsAPI);
  await runTest('Alerts API', testAlertsAPI);
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! TrafficWatch AI is ready to use.');
    console.log('🌐 Access the application at: http://localhost:5173');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('📚 See README.md for troubleshooting guide.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the application first:');
    console.log('   npm run start');
    console.log('   or');
    console.log('   npm run dev:full');
    process.exit(1);
  }
  
  console.log('✅ Server is running. Starting tests...\n');
  
  await runAllTests();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run tests
main().catch((error) => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
}); 