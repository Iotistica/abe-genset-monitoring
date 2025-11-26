# Quick Start Guide

Get up and running with the ComAp ABE API in 5 minutes.

## Step 1: Installation

```bash
cd c:\Users\Dan\abe
npm install
```

## Step 2: Configuration

1. Copy the example environment file:
```bash
Copy-Item .env.example .env
```

2. Edit `.env` and add your credentials:
```env
API_BASE_URL=https://api.ABE.net/v1.1
LOGIN_ID=your_ABE_login_id
ACCESS_TOKEN=your_bearer_access_token
COMAP_KEY=your_comap_subscription_key
```

### Where to Find Your Credentials

- **LOGIN_ID**: Your ABE account username/login ID
- **ACCESS_TOKEN**: Bearer token from authentication (contact support for details)
- **COMAP_KEY**: Found in your user profile on the ABE portal

## Step 3: Test Connection

Run the basic example to test your setup:

```bash
npm run example:basic
```

If configured correctly, you should see a list of your units.

## Step 4: Your First API Call

Create a new file `test.js`:

```javascript
require('dotenv').config();
const ABEAPI = require('./src/index');

async function test() {
  // Initialize API
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY
  });

  try {
    // Get all units
    const result = await api.units.list();
    console.log(`You have ${result.count} unit(s):`);
    
    result.units.forEach(unit => {
      console.log(`- ${unit.name} (${unit.unitGuid})`);
    });

    // Get values from first unit
    if (result.units.length > 0) {
      const unitGuid = result.units[0].unitGuid;
      const values = await api.units.getValues(unitGuid);
      
      console.log(`\nValues from ${values.name}:`);
      values.values.slice(0, 5).forEach(v => {
        console.log(`${v.name}: ${v.value} ${v.unit || ''}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
```

Run it:
```bash
node test.js
```

## Step 5: Common Operations

### Read Unit Values

```javascript
const values = await api.units.getValues(unitGuid);
```

### Send a Command

```javascript
// ⚠️ CAUTION: This will actually control the unit!
await api.units.sendCommand(unitGuid, {
  command: 'start'
});
```

### Get Historical Data

```javascript
const { getDateRange } = require('./src/utils/helpers');

const range = getDateRange(7); // Last 7 days
const history = await api.units.getHistory(unitGuid, range);
```

### Monitor Units

```javascript
setInterval(async () => {
  const values = await api.units.getValues(unitGuid);
  console.log('Current RPM:', values.values.find(v => v.name === 'RPM')?.value);
}, 10000); // Every 10 seconds
```

## Step 6: Explore Examples

Check out the example files for more advanced usage:

```bash
# View all available examples
npm run example:basic      # Basic API usage
npm run example:history    # Historical data
npm run example:monitor    # Real-time monitoring
npm run example:advanced   # Advanced patterns
```

## Next Steps

- 📖 Read the [Complete API Reference](./API_REFERENCE.md)
- 🎮 Learn about [Available Commands](./COMMANDS.md)
- 💡 Study the example files in `/examples`

## Troubleshooting

### Connection Failed
- Verify your credentials in `.env`
- Check that your access token is valid and not expired
- Ensure your subscription key is correct

### 401 Unauthorized
- Your access token may be expired
- Double-check your `LOGIN_ID` and `COMAP_KEY`

### 429 Rate Limit
- The history endpoint is limited to 1 request per second
- Add delays between requests using `await sleep(1000)`

### 400 Bad Request
- Check that `unitGuid` is correct
- For history, ensure date range is within 31 days
- Verify date format is MM/DD/YYYY

## Getting Help

- Check the [API Reference](./API_REFERENCE.md) for detailed documentation
- Review example files for working code
- Contact api@ABE.net for API support

## Quick Reference

```javascript
// Initialize
const api = new ABEAPI({ loginId, accessToken, comapKey });

// Units
await api.units.list()                           // List all units
await api.units.getInfo(unitGuid)                // Unit details
await api.units.getValues(unitGuid)              // Current values
await api.units.getHistory(unitGuid, {from, to}) // Historical data
await api.units.sendCommand(unitGuid, command)   // Send command
await api.units.getComments(unitGuid)            // Get comments
await api.units.getFiles(unitGuid)               // List files

// Commands
{ command: 'start' }
{ command: 'stop' }
{ command: 'changeMode', mode: 'man' }
{ command: 'userButton', index: 1, action: 'pulse' }

// Helpers
const { getDateRange, retryWithBackoff } = require('./src/utils/helpers');
```

Happy coding! 🚀
