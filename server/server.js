const express = require('express');
const cors = require('cors');
const fs = require('fs');
const unitsRouter = require('./routes/units');
const identityRouter = require('./routes/identity');

const app = express();
// Azure sets PORT automatically, fallback to 3000 for local development
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'https://proud-sea-01855e30f.3.azurestaticapps.net',
    'https://abe.iotistic.ca'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock authentication middleware
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const comapKey = req.headers['comap-key'];
  
  // For mock server, accept any Bearer token and Comap-Key
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header'
    });
  }
  
  if (!comapKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Comap-Key header'
    });
  }
  
  // Extract loginId from path for units endpoints
  const loginIdMatch = req.path.match(/^\/v1\.1\/([^\/]+)\//);
  if (loginIdMatch) {
    req.loginId = loginIdMatch[1];
  }
  
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve OpenAPI documentation
app.get('/api-docs', (req, res) => {
  const openApiPath = path.join(__dirname, 'comap.json');
  if (fs.existsSync(openApiPath)) {
    res.sendFile(openApiPath);
  } else {
    res.status(404).json({ error: 'API documentation not found' });
  }
});

// API Routes
app.use('/identity', identityRouter); // Identity endpoints don't require loginId in path
app.use('/v1.1/:loginId/units', authenticateRequest, unitsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Alfa Balt Mock API Server running on port ${PORT}`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🔐 Authentication:`);
  console.log(`   - Use any Bearer token in Authorization header`);
  console.log(`   - Use any Comap-Key in Comap-Key header`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   - POST /identity/token`);
  console.log(`   - GET  /v1.1/{loginId}/units`);
  console.log(`   - GET  /v1.1/{loginId}/units/{unitGuid}/info`);
  console.log(`   - GET  /v1.1/{loginId}/units/{unitGuid}/values`);
  console.log(`   - GET  /v1.1/{loginId}/units/{unitGuid}/permissions`);
  console.log(`   - GET  /v1.1/{loginId}/units/{unitGuid}/history`);
  console.log(`   - POST /v1.1/{loginId}/units/{unitGuid}/commands`);
  console.log(`   - And more...\n`);
});

module.exports = app;
