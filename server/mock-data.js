// Mock genset data for ABE API
const { v4: uuidv4 } = require('uuid');

// Mock units (gensets)
const units = [
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440001',
    unitName: 'GenSet-01-Main',
    unitType: 'InteliGen 200',
    gensetManufacturer: 'Cummins',
    gensetModel: 'C550 D5',
    engineManufacturer: 'Cummins',
    engineModel: 'QSX15-G9',
    engineSerialNumber: 'CUM87654321',
    alternatorManufacturer: 'Stamford',
    alternatorModel: 'HCI544D',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-001',
    customerName: 'Industrial Plant Alpha',
    siteId: 'SITE-001',
    siteName: 'Main Power Station',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Industrial Ave, New York, NY'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2023-01-15T00:00:00Z',
    serialNumber: 'GEN-2023-001-A',
    powerRating: 500, // kW
    permissions: ['read', 'write', 'command', 'configure'],
    alarms: []
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440002',
    unitName: 'GenSet-02-Backup',
    unitType: 'InteliGen 200',
    gensetManufacturer: 'Cummins',
    gensetModel: 'C550 D5',
    engineManufacturer: 'Cummins',
    engineModel: 'QSX15-G9',
    engineSerialNumber: 'CUM87654322',
    alternatorManufacturer: 'Stamford',
    alternatorModel: 'HCI544D',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-001',
    customerName: 'Industrial Plant Alpha',
    siteId: 'SITE-001',
    siteName: 'Main Power Station',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Industrial Ave, New York, NY'
    },
    status: 'Standby',
    state: 'Ready',
    lastCommunication: new Date(Date.now() - 300000).toISOString(),
    installationDate: '2023-01-15T00:00:00Z',
    serialNumber: 'GEN-2023-001-B',
    powerRating: 500, // kW
    permissions: ['read', 'write', 'command']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440003',
    unitName: 'GenSet-03-Emergency',
    unitType: 'InteliCompact NT',
    gensetManufacturer: 'Caterpillar',
    gensetModel: 'XQ750',
    engineManufacturer: 'Caterpillar',
    engineModel: 'C18 ACERT',
    engineSerialNumber: 'CAT45678901',
    alternatorManufacturer: 'Caterpillar',
    alternatorModel: 'SR5',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-002',
    customerName: 'Hospital Beta',
    siteId: 'SITE-002',
    siteName: 'Emergency Power Building',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      address: '456 Medical Center Dr, Los Angeles, CA'
    },
    status: 'Warning',
    state: 'Running',
    lastCommunication: new Date().toISOString(),
    installationDate: '2022-06-10T00:00:00Z',
    serialNumber: 'GEN-2022-H45-C',
    powerRating: 750, // kW
    alarms: [
      {
        id: 'ALM-001',
        severity: 'Warning',
        message: 'High coolant temperature',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        value: '95°C',
        threshold: '90°C'
      },
      {
        id: 'ALM-004',
        severity: 'Warning',
        message: 'Low fuel level',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        value: '18%',
        threshold: '20%'
      }
    ],
    permissions: ['read', 'write', 'command', 'configure']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440004',
    unitName: 'GenSet-04-Remote',
    unitType: 'InteliGen 500',
    gensetManufacturer: 'Perkins',
    gensetModel: 'P1000P',
    engineManufacturer: 'Perkins',
    engineModel: '4016-61TRG3',
    engineSerialNumber: 'PER12345678',
    alternatorManufacturer: 'Leroy Somer',
    alternatorModel: 'LSA 53.2 L9',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-003',
    customerName: 'Data Center Gamma',
    siteId: 'SITE-003',
    siteName: 'North Campus DC',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '789 Tech Blvd, San Francisco, CA'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2024-03-20T00:00:00Z',
    serialNumber: 'GEN-2024-DC-001',
    powerRating: 1000, // kW
    permissions: ['read']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440005',
    unitName: 'GenSet-05-Factory',
    unitType: 'InteliDrive Lite',
    gensetManufacturer: 'FG Wilson',
    gensetModel: 'P350P1',
    engineManufacturer: 'Perkins',
    engineModel: '2206C-E13TAG2',
    engineSerialNumber: 'FGW98765432',
    alternatorManufacturer: 'Stamford',
    alternatorModel: 'HCI434F',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-004',
    customerName: 'Manufacturing Facility Delta',
    siteId: 'SITE-004',
    siteName: 'Production Floor A',
    location: {
      latitude: 41.8781,
      longitude: -87.6298,
      address: '321 Factory Rd, Chicago, IL'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2023-08-10T00:00:00Z',
    serialNumber: 'GEN-2023-MFG-005',
    powerRating: 350, // kW
    permissions: ['read', 'write', 'command', 'configure']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440006',
    unitName: 'GenSet-06-Marina',
    unitType: 'InteliMains 210',
    gensetManufacturer: 'Kohler',
    gensetModel: '400REOZJF',
    engineManufacturer: 'John Deere',
    engineModel: '6135HF485',
    engineSerialNumber: 'KOH23456789',
    alternatorManufacturer: 'Kohler',
    alternatorModel: 'REC50',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-005',
    customerName: 'Coastal Marina',
    siteId: 'SITE-005',
    siteName: 'Harbor Power Station',
    location: {
      latitude: 25.7617,
      longitude: -80.1918,
      address: '567 Marina Blvd, Miami, FL'
    },
    status: 'Standby',
    state: 'Ready',
    lastCommunication: new Date(Date.now() - 180000).toISOString(),
    installationDate: '2024-02-05T00:00:00Z',
    serialNumber: 'GEN-2024-MAR-006',
    powerRating: 400, // kW
    permissions: ['read', 'write', 'command']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440007',
    unitName: 'GenSet-07-Mining',
    unitType: 'InteliGen 100',
    gensetManufacturer: 'Caterpillar',
    gensetModel: 'XQP650',
    engineManufacturer: 'Caterpillar',
    engineModel: 'C18',
    engineSerialNumber: 'CAT78901234',
    alternatorManufacturer: 'Caterpillar',
    alternatorModel: 'SR4B',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-006',
    customerName: 'Mining Corp Epsilon',
    siteId: 'SITE-006',
    siteName: 'Remote Mine Site',
    location: {
      latitude: 47.0511,
      longitude: -109.4358,
      address: 'Mine Road 45, Montana'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2022-11-20T00:00:00Z',
    serialNumber: 'GEN-2022-MIN-007',
    powerRating: 650, // kW
    permissions: ['read', 'write', 'command', 'configure']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440008',
    unitName: 'GenSet-08-University',
    unitType: 'InteliSys NTC BaseBox',
    gensetManufacturer: 'MTU Onsite Energy',
    gensetModel: 'DS800',
    engineManufacturer: 'MTU',
    engineModel: '12V2000 G65',
    engineSerialNumber: 'MTU34567890',
    alternatorManufacturer: 'Leroy Somer',
    alternatorModel: 'LSA 50.2 L7',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-007',
    customerName: 'State University',
    siteId: 'SITE-007',
    siteName: 'Campus Central Plant',
    location: {
      latitude: 42.3601,
      longitude: -71.0589,
      address: '789 University Ave, Boston, MA'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2023-05-15T00:00:00Z',
    serialNumber: 'GEN-2023-UNI-008',
    powerRating: 800, // kW
    permissions: ['read', 'write', 'command']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440009',
    unitName: 'GenSet-09-Hotel',
    unitType: 'InteliCompact',
    gensetManufacturer: 'HIMOINSA',
    gensetModel: 'HYW-545 T5',
    engineManufacturer: 'Yanmar',
    engineModel: '6AYM-WGT',
    engineSerialNumber: 'HIM56789012',
    alternatorManufacturer: 'Mecc Alte',
    alternatorModel: 'ECO40-2L/4',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-008',
    customerName: 'Grand Hotel',
    siteId: 'SITE-008',
    siteName: 'Hotel Basement',
    location: {
      latitude: 36.1699,
      longitude: -115.1398,
      address: '123 Strip Blvd, Las Vegas, NV'
    },
    status: 'Standby',
    state: 'Ready',
    lastCommunication: new Date(Date.now() - 420000).toISOString(),
    installationDate: '2024-01-10T00:00:00Z',
    serialNumber: 'GEN-2024-HTL-009',
    powerRating: 550, // kW
    permissions: ['read', 'write']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440010',
    unitName: 'GenSet-10-Telecom',
    unitType: 'InteliATS NT',
    gensetManufacturer: 'SDMO',
    gensetModel: 'J300K',
    engineManufacturer: 'John Deere',
    engineModel: '6090HF485',
    engineSerialNumber: 'SDM67890123',
    alternatorManufacturer: 'Leroy Somer',
    alternatorModel: 'LSA 46.2 M6',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-009',
    customerName: 'Telecom Infrastructure Inc',
    siteId: 'SITE-009',
    siteName: 'Cell Tower Site 42',
    location: {
      latitude: 47.6062,
      longitude: -122.3321,
      address: 'Tower Access Rd, Seattle, WA'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2023-09-25T00:00:00Z',
    serialNumber: 'GEN-2023-TEL-010',
    powerRating: 300, // kW
    permissions: ['read', 'command']
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440011',
    unitName: 'GenSet-11-Airport',
    unitType: 'InteliGen 300',
    gensetManufacturer: 'Cummins',
    gensetModel: 'C1250 D5',
    engineManufacturer: 'Cummins',
    engineModel: 'QSK38-G5',
    engineSerialNumber: 'CUM11223344',
    alternatorManufacturer: 'Stamford',
    alternatorModel: 'HCI634G',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-010',
    customerName: 'Regional Airport Authority',
    siteId: 'SITE-010',
    siteName: 'Terminal 2 Power',
    location: {
      latitude: 33.9425,
      longitude: -118.4081,
      address: 'Airport Way, Los Angeles, CA'
    },
    status: 'Running',
    state: 'ON',
    lastCommunication: new Date().toISOString(),
    installationDate: '2024-04-12T00:00:00Z',
    serialNumber: 'GEN-2024-APT-011',
    powerRating: 1200, // kW
    permissions: ['read', 'write', 'command', 'configure'],
    alarms: [
      {
        id: 'ALM-002',
        severity: 'Info',
        message: 'Scheduled maintenance due in 48 hours',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        value: '48h',
        threshold: '72h'
      }
    ]
  },
  {
    unitGuid: '550e8400-e29b-41d4-a716-446655440012',
    unitName: 'GenSet-12-Farm',
    unitType: 'InteliDrive DCU',
    gensetManufacturer: 'FG Wilson',
    gensetModel: 'P450P1',
    engineManufacturer: 'Perkins',
    engineModel: '2506C-E15TAG1',
    engineSerialNumber: 'FGW55443322',
    alternatorManufacturer: 'Stamford',
    alternatorModel: 'HCI444E',
    frequency: 60, // Hz
    voltage: 480, // V
    customerId: 'CUST-011',
    customerName: 'AgriTech Farms',
    siteId: 'SITE-011',
    siteName: 'North Field Operations',
    location: {
      latitude: 40.4173,
      longitude: -82.9071,
      address: 'Farm Route 7, Ohio'
    },
    status: 'Standby',
    state: 'Ready',
    lastCommunication: new Date(Date.now() - 600000).toISOString(),
    installationDate: '2023-03-22T00:00:00Z',
    serialNumber: 'GEN-2023-FRM-012',
    powerRating: 450, // kW
    permissions: ['read', 'write', 'command']
  }
];

// Function to generate realistic values for a unit
function generateUnitValues(unit) {
  const isRunning = unit.state === 'ON' || unit.status === 'Running';
  const hasWarning = unit.status === 'Warning';
  
  return {
    timestamp: new Date().toISOString(),
    engine: {
      rpm: isRunning ? 1500 + Math.random() * 50 : 0,
      hours: 15234 + Math.random() * 100,
      oilPressure: isRunning ? 45 + Math.random() * 10 : 0, // psi
      coolantTemp: isRunning ? (hasWarning ? 95 + Math.random() * 10 : 75 + Math.random() * 10) : 20, // °C
      fuelLevel: 65 + Math.random() * 20, // %
      batteryVoltage: 26.5 + Math.random() * 1.5 // V
    },
    generator: {
      voltage: {
        L1N: isRunning ? 230 + Math.random() * 10 : 0,
        L2N: isRunning ? 230 + Math.random() * 10 : 0,
        L3N: isRunning ? 230 + Math.random() * 10 : 0,
        L1L2: isRunning ? 398 + Math.random() * 15 : 0,
        L2L3: isRunning ? 398 + Math.random() * 15 : 0,
        L3L1: isRunning ? 398 + Math.random() * 15 : 0
      },
      current: {
        L1: isRunning ? 200 + Math.random() * 100 : 0,
        L2: isRunning ? 200 + Math.random() * 100 : 0,
        L3: isRunning ? 200 + Math.random() * 100 : 0
      },
      frequency: isRunning ? 50 + Math.random() * 0.5 : 0, // Hz
      power: {
        active: isRunning ? unit.powerRating * (0.6 + Math.random() * 0.3) : 0, // kW
        reactive: isRunning ? 50 + Math.random() * 30 : 0, // kVAr
        apparent: isRunning ? unit.powerRating * (0.65 + Math.random() * 0.25) : 0 // kVA
      },
      powerFactor: isRunning ? 0.85 + Math.random() * 0.1 : 0
    },
    mains: {
      available: !isRunning,
      voltage: {
        L1N: !isRunning ? 230 + Math.random() * 5 : 0,
        L2N: !isRunning ? 230 + Math.random() * 5 : 0,
        L3N: !isRunning ? 230 + Math.random() * 5 : 0
      },
      frequency: !isRunning ? 50 + Math.random() * 0.2 : 0
    },
    alarms: unit.alarms || [],
    state: unit.state,
    status: unit.status,
    controlMode: isRunning ? 'Auto' : 'Standby'
  };
}

// Function to generate historical data
function generateHistoricalData(unit, startDate, endDate, signals) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const interval = 60000; // 1 minute intervals
  const data = [];
  
  for (let time = start.getTime(); time <= end.getTime(); time += interval) {
    const timestamp = new Date(time).toISOString();
    const point = { timestamp };
    
    signals.forEach(signal => {
      switch (signal) {
        case 'EngineSpeed':
          point[signal] = 1500 + Math.sin(time / 3600000) * 50 + Math.random() * 20;
          break;
        case 'GenVoltageL1N':
          point[signal] = 230 + Math.sin(time / 1800000) * 5 + Math.random() * 3;
          break;
        case 'GenCurrentL1':
          point[signal] = 200 + Math.sin(time / 900000) * 50 + Math.random() * 20;
          break;
        case 'GenActivePower':
          point[signal] = unit.powerRating * (0.5 + Math.sin(time / 3600000) * 0.2 + Math.random() * 0.1);
          break;
        case 'FuelLevel':
          point[signal] = Math.max(20, 80 - (time - start.getTime()) / (3600000 * 10)); // Decreases over time
          break;
        case 'CoolantTemp':
          point[signal] = 75 + Math.sin(time / 7200000) * 10 + Math.random() * 5;
          break;
        case 'OilPressure':
          point[signal] = 45 + Math.random() * 5;
          break;
        default:
          point[signal] = Math.random() * 100;
      }
    });
    
    data.push(point);
  }
  
  return data;
}

// Mock comments for units
const comments = [
  {
    id: 'CMT-001',
    unitGuid: '550e8400-e29b-41d4-a716-446655440001',
    author: 'John Smith',
    authorId: 'user-001',
    text: 'Performed routine maintenance. All systems nominal.',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    category: 'maintenance'
  },
  {
    id: 'CMT-002',
    unitGuid: '550e8400-e29b-41d4-a716-446655440001',
    author: 'Jane Doe',
    authorId: 'user-002',
    text: 'Load test completed successfully. Peak load 450kW sustained for 2 hours.',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    category: 'testing'
  },
  {
    id: 'CMT-003',
    unitGuid: '550e8400-e29b-41d4-a716-446655440003',
    author: 'Mike Johnson',
    authorId: 'user-003',
    text: 'Warning: Coolant temperature rising. Scheduled inspection for tomorrow.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'alarm'
  }
];

// Mock files for units
const files = [
  {
    fileName: 'maintenance-log-2024-11.pdf',
    unitGuid: '550e8400-e29b-41d4-a716-446655440001',
    fileSize: 245678,
    uploadDate: new Date(Date.now() - 86400000).toISOString(),
    category: 'maintenance',
    description: 'Monthly maintenance log for November 2024'
  },
  {
    fileName: 'configuration-backup.cfg',
    unitGuid: '550e8400-e29b-41d4-a716-446655440001',
    fileSize: 12340,
    uploadDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    category: 'configuration',
    description: 'Controller configuration backup'
  },
  {
    fileName: 'alarm-history-2024-Q3.csv',
    unitGuid: '550e8400-e29b-41d4-a716-446655440003',
    fileSize: 89456,
    uploadDate: new Date(Date.now() - 86400000 * 60).toISOString(),
    category: 'alarms',
    description: 'Alarm history for Q3 2024'
  }
];

// Mock OAuth tokens
const tokens = new Map();

function generateToken() {
  return {
    access_token: 'mock_access_token_' + Math.random().toString(36).substr(2, 9),
    token_type: 'Bearer',
    expires_in: 3600,
    created_at: Date.now()
  };
}

// Mock applications
const applications = [
  {
    applicationId: 'app-001',
    name: 'ABE Dashboard',
    description: 'Main monitoring dashboard',
    createdAt: '2024-01-10T00:00:00Z',
    secrets: [
      {
        secretId: 'secret-001',
        clientId: 'client_' + Math.random().toString(36).substr(2, 16),
        clientSecret: 'secret_' + Math.random().toString(36).substr(2, 32),
        createdAt: '2024-01-10T00:00:00Z'
      }
    ]
  }
];

module.exports = {
  units,
  generateUnitValues,
  generateHistoricalData,
  comments,
  files,
  tokens,
  generateToken,
  applications
};
