const express = require('express');
const router = express.Router();
const mockData = require('../mock-data');

// POST /identity/token - Authenticate and get access token
router.post('/token', (req, res) => {
  try {
    const { grant_type, client_id, client_secret, username, password } = req.body;
    
    // Validate grant_type
    if (!grant_type || (grant_type !== 'client_credentials' && grant_type !== 'password')) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'grant_type must be either "client_credentials" or "password"'
      });
    }
    
    // For client_credentials flow
    if (grant_type === 'client_credentials') {
      if (!client_id || !client_secret) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'client_id and client_secret are required for client_credentials grant'
        });
      }
      
      // In mock mode, accept any client credentials
      const token = mockData.generateToken();
      mockData.tokens.set(token.access_token, {
        ...token,
        client_id,
        grant_type
      });
      
      return res.json(token);
    }
    
    // For password flow
    if (grant_type === 'password') {
      if (!username || !password) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'username and password are required for password grant'
        });
      }
      
      // In mock mode, accept any username/password
      const token = mockData.generateToken();
      mockData.tokens.set(token.access_token, {
        ...token,
        username,
        grant_type
      });
      
      return res.json(token);
    }
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      error_description: error.message
    });
  }
});

// GET /identity/application - Get all applications
router.get('/application', (req, res) => {
  try {
    // Simple auth check for identity endpoints
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }
    
    res.json({
      applications: mockData.applications,
      total: mockData.applications.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST /identity/application - Create new application
router.post('/application', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }
    
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Application name is required'
      });
    }
    
    const newApp = {
      applicationId: 'app-' + Date.now(),
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      secrets: []
    };
    
    mockData.applications.push(newApp);
    
    res.status(201).json(newApp);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE /identity/application/:applicationId - Delete application
router.delete('/application/:applicationId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }
    
    const { applicationId } = req.params;
    const appIndex = mockData.applications.findIndex(app => app.applicationId === applicationId);
    
    if (appIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application ${applicationId} not found`
      });
    }
    
    const deletedApp = mockData.applications.splice(appIndex, 1)[0];
    
    res.json({
      message: 'Application deleted successfully',
      application: deletedApp
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST /identity/application/:applicationId/secret - Create new secret
router.post('/application/:applicationId/secret', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }
    
    const { applicationId } = req.params;
    const app = mockData.applications.find(app => app.applicationId === applicationId);
    
    if (!app) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application ${applicationId} not found`
      });
    }
    
    const newSecret = {
      secretId: 'secret-' + Date.now(),
      clientId: 'client_' + Math.random().toString(36).substr(2, 16),
      clientSecret: 'secret_' + Math.random().toString(36).substr(2, 32),
      createdAt: new Date().toISOString()
    };
    
    app.secrets.push(newSecret);
    
    res.status(201).json(newSecret);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE /identity/application/:applicationId/secret/:secretId - Delete secret
router.delete('/application/:applicationId/secret/:secretId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }
    
    const { applicationId, secretId } = req.params;
    const app = mockData.applications.find(app => app.applicationId === applicationId);
    
    if (!app) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application ${applicationId} not found`
      });
    }
    
    const secretIndex = app.secrets.findIndex(s => s.secretId === secretId);
    
    if (secretIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Secret ${secretId} not found in application ${applicationId}`
      });
    }
    
    const deletedSecret = app.secrets.splice(secretIndex, 1)[0];
    
    res.json({
      message: 'Secret deleted successfully',
      secret: {
        secretId: deletedSecret.secretId,
        clientId: deletedSecret.clientId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
