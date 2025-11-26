require('dotenv').config();
const ABEAPI = require('../src/index');

/**
 * Example: Working with historical data
 */
async function fetchHistoricalData() {
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY,
    baseURL: process.env.API_BASE_URL
  });

  try {
    // Get units
    const unitsList = await api.units.list();
    if (!unitsList.units || unitsList.units.length === 0) {
      console.log('No units available');
      return;
    }

    const unit = unitsList.units[0];
    const unitGuid = unit.unitGuid;
    console.log(`Fetching historical data for: ${unit.name}`);

    // Define time range (last 7 days - max is 31 days)
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const fromStr = `${fromDate.getMonth() + 1}/${fromDate.getDate()}/${fromDate.getFullYear()}`;
    const toStr = `${toDate.getMonth() + 1}/${toDate.getDate()}/${toDate.getFullYear()}`;

    console.log(`\nDate range: ${fromStr} to ${toStr}`);

    // Example 1: Get all historical values
    console.log('\n--- Historical Values (All) ---');
    let history = await api.units.getHistory(unitGuid, {
      from: fromStr,
      to: toStr,
      offset: '0'
    });
    console.log(JSON.stringify(history, null, 2));

    // Check if there's more data (pagination)
    if (history.nextOffset !== null) {
      console.log(`\nMore data available. Next offset: ${history.nextOffset}`);
      
      // Fetch next batch
      const nextBatch = await api.units.getHistory(unitGuid, {
        from: fromStr,
        to: toStr,
        offset: history.nextOffset.toString()
      });
      console.log('\n--- Next Batch ---');
      console.log(JSON.stringify(nextBatch, null, 2));
    }

    // Example 2: Get specific value history by GUID
    // First, get current values to see available GUIDs
    console.log('\n--- Available Value GUIDs ---');
    const currentValues = await api.units.getValues(unitGuid);
    if (currentValues.values) {
      currentValues.values.forEach(v => {
        console.log(`${v.name}: ${v.valueGuid}`);
      });

      // Get history for specific values (e.g., first two)
      if (currentValues.values.length >= 2) {
        const guid1 = currentValues.values[0].valueGuid;
        const guid2 = currentValues.values[1].valueGuid;
        
        console.log(`\n--- Historical Data for Specific Values ---`);
        const specificHistory = await api.units.getHistory(unitGuid, {
          from: fromStr,
          to: toStr,
          valueGuids: `${guid1},${guid2}`,
          offset: '0'
        });
        console.log(JSON.stringify(specificHistory, null, 2));
      }
    }

    // Example 3: Get historical data for a shorter period (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const fromStr24h = `${yesterday.getMonth() + 1}/${yesterday.getDate()}/${yesterday.getFullYear()}`;
    const toStr24h = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

    console.log(`\n--- Last 24 Hours (${fromStr24h} to ${toStr24h}) ---`);
    const recent = await api.units.getHistory(unitGuid, {
      from: fromStr24h,
      to: toStr24h,
      offset: '0'
    });
    console.log(JSON.stringify(recent, null, 2));

    // Note about rate limiting
    console.log('\n⚠️  Rate Limit Info:');
    console.log('The history endpoint has a rate limit of 1 request per second');
    console.log('Check response headers: X-RateLimit-Limit and X-RateLimit-Remaining');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.status === 429) {
      console.error('⚠️  Rate limit exceeded. Wait before retrying.');
    } else if (error.status === 400) {
      console.error('⚠️  Bad request. Check that date range is within 31 days.');
    }
    if (error.data) {
      console.error('Details:', error.data);
    }
  }
}

fetchHistoricalData();
