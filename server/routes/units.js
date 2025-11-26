const express = require('express');
const router = express.Router({ mergeParams: true });
const mockData = require('../mock-data');

// GET /:loginId/units - List all units
router.get('/', (req, res) => {
  try {
    const { loginId } = req.params;
    const { filter, sortBy, limit } = req.query;
    
    let units = mockData.units.map(unit => ({
      unitGuid: unit.unitGuid,
      unitName: unit.unitName,
      unitType: unit.unitType,
      gensetManufacturer: unit.gensetManufacturer,
      gensetModel: unit.gensetModel,
      engineManufacturer: unit.engineManufacturer,
      engineModel: unit.engineModel,
      status: unit.status,
      state: unit.state,
      lastCommunication: unit.lastCommunication,
      location: unit.location,
      customerName: unit.customerName,
      siteName: unit.siteName,
      powerRating: unit.powerRating,
      activeAlarms: (unit.alarms || []).length
    }));
    
    // Apply filter if provided
    if (filter) {
      const filterLower = filter.toLowerCase();
      units = units.filter(u => 
        u.unitName.toLowerCase().includes(filterLower) ||
        u.status.toLowerCase().includes(filterLower) ||
        u.unitType.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply limit if provided
    if (limit) {
      units = units.slice(0, parseInt(limit));
    }
    
    res.json({
      units,
      total: units.length,
      loginId
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/info - Get unit info
router.get('/:unitGuid/info', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/values - Get current values
router.get('/:unitGuid/values', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    const values = mockData.generateUnitValues(unit);
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/permissions - Get permissions
router.get('/:unitGuid/permissions', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    res.json({
      unitGuid: unit.unitGuid,
      unitName: unit.unitName,
      permissions: unit.permissions || ['read']
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/history - Get historical data
router.get('/:unitGuid/history', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const { startDate, endDate, signals } = req.query;
    
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate and endDate query parameters are required (format: MM/DD/YYYY)'
      });
    }
    
    // Parse MM/DD/YYYY format
    const parseDate = (dateStr) => {
      const [month, day, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    };
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    // Validate date range (max 31 days)
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 31) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Date range cannot exceed 31 days'
      });
    }
    
    // Parse signals
    const signalList = signals ? signals.split(',') : [
      'EngineSpeed',
      'GenVoltageL1N',
      'GenCurrentL1',
      'GenActivePower',
      'FuelLevel',
      'CoolantTemp'
    ];
    
    const history = mockData.generateHistoricalData(unit, start, end, signalList);
    
    res.json({
      unitGuid,
      unitName: unit.unitName,
      startDate,
      endDate,
      signals: signalList,
      dataPoints: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST /:loginId/units/:unitGuid/commands - Send command
router.post('/:unitGuid/commands', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const { command, parameters } = req.body;
    
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    // Check permissions
    if (!unit.permissions.includes('command')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to send commands to this unit'
      });
    }
    
    // Validate command
    const validCommands = ['START', 'STOP', 'RESET_ALARM', 'TEST_MODE', 'MANUAL_MODE', 'AUTO_MODE'];
    if (!command || !validCommands.includes(command)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid command. Valid commands: ${validCommands.join(', ')}`
      });
    }
    
    // Simulate command execution
    const commandId = 'CMD-' + Date.now();
    
    res.json({
      commandId,
      unitGuid,
      unitName: unit.unitName,
      command,
      parameters: parameters || {},
      status: 'Accepted',
      timestamp: new Date().toISOString(),
      message: `Command ${command} sent successfully to ${unit.unitName}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/alarms - Get active alarms
router.get('/:unitGuid/alarms', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const { severity, limit } = req.query;
    
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    let alarms = unit.alarms || [];
    
    // Filter by severity if provided
    if (severity) {
      alarms = alarms.filter(a => a.severity.toLowerCase() === severity.toLowerCase());
    }
    
    // Apply limit if provided
    if (limit) {
      alarms = alarms.slice(0, parseInt(limit));
    }
    
    res.json({
      unitGuid,
      unitName: unit.unitName,
      total: alarms.length,
      alarms
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/comments - Get comments
router.get('/:unitGuid/comments', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const { limit, category } = req.query;
    
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    let comments = mockData.comments.filter(c => c.unitGuid === unitGuid);
    
    // Filter by category if provided
    if (category) {
      comments = comments.filter(c => c.category === category);
    }
    
    // Apply limit if provided
    if (limit) {
      comments = comments.slice(0, parseInt(limit));
    }
    
    res.json({
      unitGuid,
      unitName: unit.unitName,
      total: comments.length,
      comments
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/files - Get files list
router.get('/:unitGuid/files', (req, res) => {
  try {
    const { unitGuid } = req.params;
    const { category } = req.query;
    
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    let files = mockData.files.filter(f => f.unitGuid === unitGuid);
    
    // Filter by category if provided
    if (category) {
      files = files.filter(f => f.category === category);
    }
    
    res.json({
      unitGuid,
      unitName: unit.unitName,
      total: files.length,
      files
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /:loginId/units/:unitGuid/files/:fileName - Download file
router.get('/:unitGuid/files/:fileName', (req, res) => {
  try {
    const { unitGuid, fileName } = req.params;
    
    const unit = mockData.units.find(u => u.unitGuid === unitGuid);
    
    if (!unit) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Unit with GUID ${unitGuid} not found`
      });
    }
    
    const file = mockData.files.find(f => f.unitGuid === unitGuid && f.fileName === fileName);
    
    if (!file) {
      return res.status(404).json({
        error: 'Not Found',
        message: `File ${fileName} not found for unit ${unitGuid}`
      });
    }
    
    // In a real implementation, this would stream the actual file
    // For mock purposes, we return file metadata and mock content
    res.json({
      fileName: file.fileName,
      fileSize: file.fileSize,
      category: file.category,
      description: file.description,
      uploadDate: file.uploadDate,
      downloadUrl: `/v1.1/${req.params.loginId}/units/${unitGuid}/files/${fileName}`,
      mockContent: `This is mock content for ${fileName}. In production, actual file bytes would be returned.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
