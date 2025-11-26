# ComAp ABE API Reference

Complete API reference for the Node.js client library.

## Table of Contents

- [Authentication](#authentication)
- [API Client](#api-client)
- [Units](#units)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

## Authentication

The API uses Bearer token authentication with an additional subscription key.

### Required Credentials

1. **LOGIN_ID**: Your ABE account login ID
2. **ACCESS_TOKEN**: Bearer token for authentication
3. **COMAP_KEY**: Subscription key from your user profile

### Configuration

```javascript
const ABEAPI = require('./src/index');

const api = new ABEAPI({
  loginId: 'your_login_id',
  accessToken: 'your_access_token',
  comapKey: 'your_subscription_key',
  baseURL: 'https://api.ABE.net/v1.1', // Optional
  timeout: 30000 // Optional, in milliseconds
});
```

## API Client

### Constructor Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `loginId` | string | Yes | - | Your WSV account login ID |
| `accessToken` | string | Yes | - | Bearer access token |
| `comapKey` | string | Yes | - | Subscription key (Comap-Key header) |
| `baseURL` | string | No | `https://api.ABE.net/v1.1` | API base URL |
| `timeout` | number | No | `30000` | Request timeout in milliseconds |

### Methods

#### `testConnection()`

Tests the API connection by fetching the units list.

**Returns:** `Promise<boolean>`

```javascript
const isConnected = await api.testConnection();
console.log(isConnected); // true or false
```

## Units

All unit-related operations.

### `units.list()`

Returns a list of all units under your account.

**Returns:** `Promise<Object>`

```javascript
const result = await api.units.list();
console.log(result.count); // Number of units
console.log(result.units); // Array of units
```

**Response format:**
```json
{
  "count": 2,
  "units": [
    {
      "name": "Controller 1",
      "unitGuid": "gensete5ffa1149c0c85b9a4238f8a2e812130",
      "url": "https://ABE.azure-api.net/api/v1/units/gensete5ffa1149c0c85b9a4238f8a2e812130"
    }
  ]
}
```

### `units.getInfo(unitGuid)`

Gets basic information about a unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier

**Returns:** `Promise<Object>`

```javascript
const info = await api.units.getInfo('gensete5ffa1149...');
```

**Response includes:**
- `name`: Unit name
- `unitGuid`: Unique identifier
- `ownerLoginId`: Owner account
- `applicationType`: Application type
- `timezone`: Configured timezone
- `connection`: Network connection details
- `position`: Geographical position

### `units.getValues(unitGuid, params)`

Gets current values/measurements from a unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier
- `params` (Object, optional):
  - `valueGuids` (string): Comma-separated value GUIDs (omit for all values)

**Returns:** `Promise<Object>`

```javascript
// Get all values
const values = await api.units.getValues(unitGuid);

// Get specific values
const specificValues = await api.units.getValues(unitGuid, {
  valueGuids: 'guid1,guid2,guid3'
});
```

**Response format:**
```json
{
  "name": "Controller 1",
  "unitGuid": "genset...",
  "values": [
    {
      "name": "RPM",
      "valueGuid": "6629f84f-4b79-43c2-ab33-1f27f1f8c42b",
      "value": 1500,
      "unit": "RPM",
      "highLimit": 3000,
      "lowLimit": 0,
      "decimalPlaces": 0,
      "timeStamp": "2018-06-10T19:08:12.9400000+00:00"
    }
  ]
}
```

### `units.getPermissions(unitGuid)`

Gets user permissions for a unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier

**Returns:** `Promise<Object>`

```javascript
const permissions = await api.units.getPermissions(unitGuid);
```

**Response includes permissions array with:**
- `loginId`: User login name
- `read`: Can read values
- `control`: Can control the unit
- `modify`: Can change settings
- `shutdownNote`: Can do shutdown notes
- `allAlarmsNote`: Can do alarm notes

### `units.getHistory(unitGuid, params)`

Gets historical data from a unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier
- `params` (Object):
  - `from` (string): Start date in MM/DD/YYYY format
  - `to` (string): End date in MM/DD/YYYY format
  - `offset` (string, optional): Offset for pagination (default: '0')
  - `valueGuids` (string, optional): Comma-separated value GUIDs

**Returns:** `Promise<Object>`

**Important notes:**
- Maximum date range: 31 days
- Response limited to 200KB per request
- Use `nextOffset` for pagination
- Rate limited to 1 request per second

```javascript
const history = await api.units.getHistory(unitGuid, {
  from: '11/01/2023',
  to: '11/07/2023',
  offset: '0'
});

// Check for more data
if (history.nextOffset !== null) {
  const nextBatch = await api.units.getHistory(unitGuid, {
    from: '11/01/2023',
    to: '11/07/2023',
    offset: history.nextOffset.toString()
  });
}
```

**Response format:**
```json
{
  "name": "Controller 1",
  "unitGuid": "genset...",
  "nextOffset": null,
  "values": [
    {
      "name": "RPM",
      "valueGuid": "6629f84f-...",
      "history": [
        {
          "value": 1500,
          "validTo": "2018-06-10T11:44:02.4370000+00:00"
        }
      ],
      "unit": "RPM",
      "decimalPlaces": 0
    }
  ]
}
```

### `units.sendCommand(unitGuid, command)`

Sends a command to a unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier
- `command` (Object): Command object (see [Commands Reference](./COMMANDS.md))

**Returns:** `Promise<Object>`

```javascript
// Start unit
await api.units.sendCommand(unitGuid, {
  command: 'start'
});

// Change mode
await api.units.sendCommand(unitGuid, {
  command: 'changeMode',
  mode: 'man'
});
```

See [COMMANDS.md](./COMMANDS.md) for complete command reference.

### `units.getComments(unitGuid)`

Gets comments posted on unit's detail view.

**Parameters:**
- `unitGuid` (string): Unique unit identifier

**Returns:** `Promise<Object>`

```javascript
const comments = await api.units.getComments(unitGuid);
```

**Response includes:**
- `id`: Comment ID
- `author`: Comment author
- `date`: Creation timestamp
- `text`: Comment message
- `active`: Comment status

### `units.getFiles(unitGuid)`

Lists all files stored in the unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier

**Returns:** `Promise<Object>`

```javascript
const files = await api.units.getFiles(unitGuid);
```

**Response format:**
```json
{
  "unitGuid": "genset...",
  "files": [
    {
      "fileName": "2018-09-18_10-18_controller 1.csv",
      "fileType": "unitHistory",
      "generated": "2018-09-18T08:18:47.0000000+00:00"
    }
  ]
}
```

### `units.downloadFile(unitGuid, fileName)`

Downloads a file from the unit.

**Parameters:**
- `unitGuid` (string): Unique unit identifier
- `fileName` (string): Name of the file to download

**Returns:** `Promise<Object>`

```javascript
const fileContent = await api.units.downloadFile(
  unitGuid, 
  '2018-09-18_10-18_controller 1.csv'
);
```

## Error Handling

All API methods throw errors that include:

```javascript
try {
  await api.units.getInfo('invalid-guid');
} catch (error) {
  console.error(error.message);  // Error description
  console.error(error.status);   // HTTP status code (400, 401, 429, etc.)
  console.error(error.data);     // Additional error data from API
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters or unitGuid) |
| 401 | Unauthorized (invalid or expired token) |
| 429 | Too Many Requests (rate limit exceeded) |

## Rate Limits

### History Endpoint

- **Limit**: 1 request per second (60 requests per rolling 60-second window)
- **Headers**: Response includes rate limit information
  - `X-RateLimit-Limit`: Fixed window size (always 60)
  - `X-RateLimit-Remaining`: Requests remaining in current window

```javascript
try {
  const history = await api.units.getHistory(unitGuid, params);
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded
    // Check Retry-After header if available
    console.log('Rate limit exceeded, retry after delay');
  }
}
```

### Best Practices

1. **Implement delays** between requests when fetching multiple units
2. **Handle 429 errors** gracefully with exponential backoff
3. **Cache responses** when possible to reduce API calls
4. **Use pagination** (`offset`/`nextOffset`) for large historical data requests
5. **Monitor rate limit headers** to avoid hitting limits

## Complete Example

```javascript
require('dotenv').config();
const ABEAPI = require('./src/index');

async function main() {
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY
  });

  try {
    // Get all units
    const unitsList = await api.units.list();
    console.log(`Found ${unitsList.count} units`);

    // Work with first unit
    if (unitsList.units.length > 0) {
      const unitGuid = unitsList.units[0].unitGuid;

      // Get unit info
      const info = await api.units.getInfo(unitGuid);
      console.log('Unit info:', info);

      // Get current values
      const values = await api.units.getValues(unitGuid);
      console.log('Current values:', values);

      // Send command
      await api.units.sendCommand(unitGuid, {
        command: 'start'
      });
      console.log('Start command sent');

      // Get historical data
      const history = await api.units.getHistory(unitGuid, {
        from: '11/01/2023',
        to: '11/07/2023'
      });
      console.log('Historical data:', history);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```
