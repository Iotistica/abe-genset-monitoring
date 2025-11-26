# Alfa Balt Dashboard

Modern web dashboard for monitoring and controlling genset units via the Alfa Balt API.

## Features

- ✅ **Real-time Monitoring** - Live data from all genset units
- 🔍 **Search & Filter** - Filter by status, manufacturer, or search by name
- 📊 **Statistics Dashboard** - Overview of running, standby, and warning units
- 🎛️ **Unit Details** - Detailed engine, generator, and equipment information
- ⚡ **Command Control** - Send START, STOP, and RESET_ALARM commands
- 🔄 **Auto-refresh** - Updates every 5 seconds
- 📱 **Responsive Design** - Works on desktop and mobile

## Quick Start

### 1. Start the Mock API Server

```bash
# From the project root (c:\Users\Dan\abe)
npm run server
```

Server will start on `http://localhost:3001`

### 2. Open the Dashboard

Simply open `dashboard/index.html` in your web browser:

```bash
# Windows
start dashboard/index.html

# Or just double-click index.html in File Explorer
```

No build step or npm install needed - it's pure HTML/CSS/JavaScript!

> **Note:** The Alfa Balt API is fully compatible with the original ABE API specification.

## Dashboard Views

### Main Dashboard
- **Statistics Cards**: Total units, running, standby, warnings, total power
- **Unit Cards**: Quick view of each genset with status, power, and key metrics
- **Live Indicators**: Pulsing dots show running units
- **Search Bar**: Find units by name, type, or manufacturer
- **Status Filter**: Show only Running, Standby, or Warning units
- **Manufacturer Filter**: Filter by genset manufacturer

### Unit Details Modal
Click any unit card to see:
- Equipment information (controller, genset, engine, alternator)
- Engine parameters (RPM, hours, oil pressure, coolant temp, fuel, battery)
- Generator output (3-phase voltage, current, frequency, power)
- Active alarms (if any)
- Control buttons (Start, Stop, Reset Alarm)

## Technical Details

### API Endpoints Used

```javascript
GET  /v1.1/{loginId}/units              // List all units
GET  /v1.1/{loginId}/units/{id}/info    // Unit details
GET  /v1.1/{loginId}/units/{id}/values  // Live values
POST /v1.1/{loginId}/units/{id}/commands // Send commands
```

### Configuration

Edit `dashboard/app.js` to change API settings:

```javascript
const API_BASE_URL = 'http://localhost:3001';
const LOGIN_ID = 'mylogin';
const AUTH_TOKEN = 'test_token';
const COMAP_KEY = 'test_key';
```

### Auto-refresh Interval

Default: 5 seconds. Change in `app.js`:

```javascript
setInterval(() => {
    loadUnits(true);
}, 5000); // milliseconds
```

## Customization

### Colors & Styling
Edit `dashboard/styles.css`:
- Status colors (running, standby, warning)
- Card shadows and hover effects
- Background gradient
- Typography

### Features to Add
- Historical data charts
- Alarm notifications
- Export data to CSV
- Dark mode toggle
- Custom date range for history
- Multi-unit command sending

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Troubleshooting

### "Disconnected" status
- Make sure the API server is running: `npm run server`
- Check that server is on port 3001
- Open browser console (F12) to see detailed errors

### No units showing
- Check browser console for CORS errors
- Verify API server is accessible at `http://localhost:3001`
- Test API directly: `http://localhost:3001/health`

### Modal not opening
- Check browser console for JavaScript errors
- Make sure all files are in the same directory

## Files Structure

```
dashboard/
├── index.html    # Main HTML structure
├── styles.css    # All styling and responsive design
├── app.js        # JavaScript logic and API calls
└── README.md     # This file
```

## Next Steps

1. **Deploy**: Host on any web server (Apache, Nginx, IIS, or static hosting)
2. **Real API**: Update API_BASE_URL to point to production ABE API
3. **Authentication**: Add proper OAuth login flow
4. **Charts**: Integrate Chart.js or D3.js for historical data visualization
5. **Notifications**: Add WebSocket or Server-Sent Events for real-time alerts

## License

MIT
