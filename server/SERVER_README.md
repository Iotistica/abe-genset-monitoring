# Alfa Balt Mock API Server

Express.js server implementing Alfa Balt API v1.1 (ABE-compatible) with realistic mock genset data for prototype development.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
# Production mode
npm run server

# Development mode (auto-restart on changes)
npm run server:dev
```

The server will start on `http://localhost:3000` (or port specified in `.env`)

### 3. Test the API
```bash
# Health check
curl http://localhost:3000/health

# Get OAuth token
curl -X POST http://localhost:3000/identity/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"client_credentials","client_id":"test","client_secret":"test"}'

# List all units (use any Bearer token and Comap-Key)
curl http://localhost:3000/v1.1/mylogin/units \
  -H "Authorization: Bearer mock_token" \
  -H "Comap-Key: mock_key"
```

## 📋 Available Endpoints

### Identity API (`/identity`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/identity/token` | Get OAuth access token |
| GET | `/identity/application` | List all applications |
| POST | `/identity/application` | Create new application |
| DELETE | `/identity/application/:applicationId` | Delete application |
| POST | `/identity/application/:applicationId/secret` | Create client secret |
| DELETE | `/identity/application/:applicationId/secret/:secretId` | Delete client secret |

### Units API (`/v1.1/:loginId/units`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1.1/:loginId/units` | List all genset units |
| GET | `/v1.1/:loginId/units/:unitGuid/info` | Get unit details |
| GET | `/v1.1/:loginId/units/:unitGuid/values` | Get current values (live data) |
| GET | `/v1.1/:loginId/units/:unitGuid/permissions` | Get user permissions |
| GET | `/v1.1/:loginId/units/:unitGuid/history` | Get historical data |
| POST | `/v1.1/:loginId/units/:unitGuid/commands` | Send command to unit |
| GET | `/v1.1/:loginId/units/:unitGuid/comments` | Get unit comments |
| GET | `/v1.1/:loginId/units/:unitGuid/files` | List unit files |
| GET | `/v1.1/:loginId/units/:unitGuid/files/:fileName` | Download file |

## 🔐 Authentication

For this mock server, authentication is simplified:
- **Identity endpoints** (`/identity/token`): No auth required for token generation
- **Units endpoints**: Require `Authorization: Bearer <any-token>` and `Comap-Key: <any-key>` headers

In production, replace with real OAuth 2.0 validation.

## 🎲 Mock Data

The server includes 4 pre-configured genset units:

### 1. GenSet-01-Main
- **Type**: InteliGen 200
- **Status**: Running
- **Power**: 500 kW
- **Location**: New York, NY
- **GUID**: `550e8400-e29b-41d4-a716-446655440001`

### 2. GenSet-02-Backup
- **Type**: InteliGen 200
- **Status**: Standby
- **Power**: 500 kW
- **Location**: New York, NY
- **GUID**: `550e8400-e29b-41d4-a716-446655440002`

### 3. GenSet-03-Emergency
- **Type**: InteliCompact NT
- **Status**: Warning (high coolant temp)
- **Power**: 750 kW
- **Location**: Los Angeles, CA
- **GUID**: `550e8400-e29b-41d4-a716-446655440003`

### 4. GenSet-04-Remote
- **Type**: InteliGen 500
- **Status**: Running
- **Power**: 1000 kW
- **Location**: San Francisco, CA
- **GUID**: `550e8400-e29b-41d4-a716-446655440004`

## 📊 Realistic Data Generated

### Live Values (GET `/units/:unitGuid/values`)
Each running unit returns realistic real-time data:
- **Engine**: RPM, oil pressure, coolant temperature, fuel level, battery voltage, running hours
- **Generator**: 3-phase voltage (L1-N, L2-N, L3-N, L1-L2, L2-L3, L3-L1)
- **Generator**: 3-phase current (L1, L2, L3)
- **Power**: Active power (kW), reactive power (kVAr), apparent power (kVA), power factor
- **Frequency**: 50 Hz ± variations
- **Mains**: Availability, voltage, frequency
- **Alarms**: Active alarms with severity and timestamps

### Historical Data (GET `/units/:unitGuid/history`)
- Generates time-series data with 1-minute intervals
- Supports date range queries (max 31 days)
- Default signals: EngineSpeed, GenVoltageL1N, GenCurrentL1, GenActivePower, FuelLevel, CoolantTemp
- Custom signals via `?signals=Signal1,Signal2` query parameter
- Date format: MM/DD/YYYY

### Commands (POST `/units/:unitGuid/commands`)
Supported commands:
- `START` - Start the generator
- `STOP` - Stop the generator
- `RESET_ALARM` - Reset active alarms
- `TEST_MODE` - Enter test mode
- `MANUAL_MODE` - Switch to manual control
- `AUTO_MODE` - Switch to automatic control

## 🔧 API Examples

### Get Live Data
```bash
curl http://localhost:3000/v1.1/mylogin/units/550e8400-e29b-41d4-a716-446655440001/values \
  -H "Authorization: Bearer token123" \
  -H "Comap-Key: key123"
```

### Get Historical Data
```bash
# Last 24 hours with specific signals
curl "http://localhost:3000/v1.1/mylogin/units/550e8400-e29b-41d4-a716-446655440001/history?startDate=11/24/2025&endDate=11/25/2025&signals=EngineSpeed,FuelLevel" \
  -H "Authorization: Bearer token123" \
  -H "Comap-Key: key123"
```

### Send Command
```bash
curl -X POST http://localhost:3000/v1.1/mylogin/units/550e8400-e29b-41d4-a716-446655440001/commands \
  -H "Authorization: Bearer token123" \
  -H "Comap-Key: key123" \
  -H "Content-Type: application/json" \
  -d '{"command":"START","parameters":{}}'
```

### Create OAuth Application
```bash
curl -X POST http://localhost:3000/identity/application \
  -H "Authorization: Bearer token123" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Dashboard","description":"Monitoring dashboard"}'
```

## 📁 Project Structure

```
server/
├── server.js           # Express app and middleware
├── mock-data.js        # Mock genset data and generators
└── routes/
    ├── units.js        # Units API endpoints
    └── identity.js     # Identity/OAuth endpoints
```

## 🛠️ Customization

### Adding More Units
Edit `server/mock-data.js` and add to the `units` array:

```javascript
{
  unitGuid: 'your-unique-guid',
  unitName: 'GenSet-05-Custom',
  unitType: 'InteliGen 200',
  status: 'Running',
  state: 'ON',
  powerRating: 600,
  // ... other properties
}
```

### Modifying Data Generation
The `generateUnitValues()` function in `mock-data.js` creates realistic live data with randomization.
The `generateHistoricalData()` function creates time-series data with sinusoidal patterns.

### Changing Server Port
Update `.env` file:
```
SERVER_PORT=8080
```

## 🔄 Using with the Client Library

This mock server is fully compatible with the ABE client library in `src/`:

```javascript
const ABEAPI = require('./src/index');

const api = new ABEAPI({
  baseURL: 'http://localhost:3000/v1.1',  // Point to mock server
  loginId: 'mylogin',
  comapKey: 'mock_key',
  accessToken: 'mock_token'
});

// Now use the client as normal
const units = await api.units.list();
console.log(units);
```

## 📝 Development Notes

- **No Database**: All data is in-memory and resets on server restart
- **Mock Authentication**: Accepts any credentials - replace with real auth for production
- **CORS Enabled**: All origins allowed for development
- **Rate Limiting**: Not implemented - add for production
- **Persistence**: To persist data, add database integration (MongoDB, PostgreSQL, etc.)

## 🚦 Next Steps

1. **Test with Client**: Use the client library to test all endpoints
2. **Add Database**: Integrate MongoDB/PostgreSQL for data persistence
3. **Real Auth**: Implement proper OAuth 2.0 validation
4. **WebSocket**: Add real-time data streaming
5. **Rate Limiting**: Add express-rate-limit middleware
6. **API Documentation**: Add Swagger/OpenAPI UI

## 📞 Support

For issues or questions, refer to the main project documentation in the root directory.
