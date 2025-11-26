# Alfa Balt API Client

Node.js client library for Alfa Balt API v1.1 (ComAp ABE-compatible).

## Features

✅ Complete API coverage for all Alfa Balt endpoints (ABE-compatible)  
✅ Full command support (start, stop, mode changes, timers, etc.)  
✅ Historical data retrieval with pagination  
✅ Unit monitoring and value reading  
✅ File management and downloads  
✅ Built-in error handling and retry logic  
✅ Utility helpers for common tasks  
✅ Comprehensive documentation and examples  

## Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in your API credentials:

```env
API_BASE_URL=https://api.ABE.net/v1.1
LOGIN_ID=your_ABE_login_id
ACCESS_TOKEN=your_bearer_access_token
COMAP_KEY=your_comap_subscription_key
```

### Getting Credentials

You have two options for authentication:

#### Option 1: Use Existing Credentials (if you have them)
- **LOGIN_ID**: Your Alfa Balt account login ID
- **ACCESS_TOKEN**: Bearer token you already have
- **COMAP_KEY**: Subscription key from your user profile

#### Option 2: Create OAuth Credentials (recommended)
Use the Identity API to create OAuth credentials:

```bash
npm run auth
```

This will:
1. Create an application registration
2. Generate a client ID and secret
3. Get an access token
4. Save credentials to use in your .env file

See [Authentication Guide](./docs/AUTHENTICATION.md) for details.

## Usage

```javascript
const AlfalabaltAPI = require('./src/index');

const api = new AlfalabaltAPI({
  loginId: process.env.LOGIN_ID,
  accessToken: process.env.ACCESS_TOKEN,
  comapKey: process.env.COMAP_KEY,
  baseURL: process.env.API_BASE_URL
});

// Example: Get all units
async function getUnits() {
  try {
    const result = await api.units.list();
    console.log(`Found ${result.count} units`);
    console.log(result.units);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getUnits();
```

## Quick Examples

### Get Unit Values
```javascript
const values = await api.units.getValues(unitGuid);
console.log(values);
```

### Send Commands
```javascript
// Start unit
await api.units.sendCommand(unitGuid, { command: 'start' });

// Change mode
await api.units.sendCommand(unitGuid, { 
  command: 'changeMode', 
  mode: 'man' 
});
```

### Get Historical Data
```javascript
const history = await api.units.getHistory(unitGuid, {
  from: '11/01/2023',
  to: '11/07/2023'
});
```

## Documentation

- 📖 [Complete API Reference](./docs/API_REFERENCE.md) - Full API documentation
- 🎮 [Commands Reference](./docs/COMMANDS.md) - All available commands with examples
- 💡 [Examples](#examples) - Working code examples

## Examples

Run the included examples:

```bash
# Basic usage
npm run example:basic

# Send commands (commands are commented out for safety)
npm run example:commands

# Work with historical data
npm run example:history

# Real-time monitoring
npm run example:monitor

# Advanced usage with helpers
npm run example:advanced
```

Example files located in `/examples`:
- `basic-usage.js` - Getting started with the API
- `commands.js` - Sending commands to units
- `historical-data.js` - Fetching and working with history
- `monitoring.js` - Real-time unit monitoring
- `advanced-usage.js` - Using utility helpers
```

## API Methods

### Authentication & Identity
- `api.identity.authenticate(clientId, secret)` - Get OAuth access token
- `api.identity.getApplication()` - Get application registration
- `api.identity.createApplication()` - Create new application
- `api.identity.deleteApplication()` - Delete application
- `api.identity.createSecret(clientId, options)` - Create new secret (max 2)
- `api.identity.deleteSecret(clientId, secretId)` - Delete secret

See [Authentication Guide](./docs/AUTHENTICATION.md) for complete details.

### Units
- `api.units.list()` - List all units under your account
- `api.units.getInfo(unitGuid)` - Get unit basic information
- `api.units.getValues(unitGuid, params)` - Get current unit values
- `api.units.getPermissions(unitGuid)` - Get unit user permissions
- `api.units.getHistory(unitGuid, params)` - Get historical data (max 31 days)
- `api.units.sendCommand(unitGuid, command)` - Send command to unit
- `api.units.getComments(unitGuid)` - Get unit comments
- `api.units.getFiles(unitGuid)` - List files stored in unit
- `api.units.downloadFile(unitGuid, fileName)` - Download a file

### Available Commands

```javascript
// Start/Stop
await api.units.sendCommand(unitGuid, { command: 'start' });
await api.units.sendCommand(unitGuid, { command: 'stop' });
await api.units.sendCommand(unitGuid, { command: 'faultReset' });

// Change mode
await api.units.sendCommand(unitGuid, { 
  command: 'changeMode', 
  mode: 'man' // off, man, aut, test
});

// Toggle circuit breakers
await api.units.sendCommand(unitGuid, { command: 'changeMcb' }); // Mains
await api.units.sendCommand(unitGuid, { command: 'changeGcb' }); // Genset

// User button
await api.units.sendCommand(unitGuid, { 
  command: 'userButton',
  index: 1,
  action: 'start' // start, stop, toggle, pulse
});

// Set external value
await api.units.sendCommand(unitGuid, { 
  command: 'extValue',
  index: 1,
  value: 100
});

// Change setpoint
await api.units.sendCommand(unitGuid, { 
  command: 'changeSetpoint',
  guid: 'value-guid-here',
  value: 'NewValue'
});
```

## Rate Limits

- **History endpoint**: 1 request per second (60 requests per rolling 60-second window)
- Response headers include `X-RateLimit-Limit` and `X-RateLimit-Remaining`
- Exceeding limits returns HTTP 429 with `Retry-After` header

## Project Structure

```
abe/
├── src/
│   ├── index.js              # Main API client
│   ├── client.js             # HTTP client with auth
│   ├── resources/
│   │   └── units.js          # Units resource
│   └── utils/
│       └── helpers.js        # Utility functions
├── examples/
│   ├── basic-usage.js        # Getting started
│   ├── commands.js           # Command examples
│   ├── historical-data.js    # History examples
│   ├── monitoring.js         # Monitoring service
│   └── advanced-usage.js     # Advanced patterns
├── docs/
│   ├── API_REFERENCE.md      # Complete API docs
│   └── COMMANDS.md           # Commands reference
└── src/opneapi/
    └── comap.json            # OpenAPI specification
```

## Utility Helpers

The library includes helpful utilities in `src/utils/helpers.js`:

```javascript
const { 
  getDateRange,           // Easy date range creation
  formatDateForAPI,       // Format dates for API
  createTimerConfig,      // Build timer configurations
  parseHistoricalData,    // Parse history into time-series
  retryWithBackoff,       // Retry failed requests
  batchProcess,           // Process multiple units
  findValueGuid           // Find value GUIDs by name
} = require('./src/utils/helpers');

// Example: Get last 7 days
const range = getDateRange(7);
const history = await api.units.getHistory(unitGuid, range);
```

## Error Handling

All methods throw descriptive errors:

```javascript
try {
  await api.units.sendCommand(unitGuid, command);
} catch (error) {
  console.error(error.message);  // Description
  console.error(error.status);   // HTTP status (400, 401, 429)
  console.error(error.data);     // Additional details
}
```

## TypeScript Support

While this library is written in JavaScript, it's designed to be TypeScript-friendly. You can easily add type definitions if needed.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For API-related questions or support:
- Email: api@ABE.net
- Documentation: https://portal.ABE.net/

## License

MIT
