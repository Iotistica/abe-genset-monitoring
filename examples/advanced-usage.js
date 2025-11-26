require('dotenv').config();
const ABEAPI = require('../src/index');
const { 
  getDateRange, 
  retryWithBackoff,
  batchProcess,
  findValueGuid 
} = require('../src/utils/helpers');

/**
 * Advanced usage examples demonstrating utility helpers
 */
async function main() {
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY
  });

  try {
    // Example 1: Using date range helper
    console.log('--- Example 1: Easy Date Ranges ---');
    const unitsList = await api.units.list();
    
    if (unitsList.units.length > 0) {
      const unitGuid = unitsList.units[0].unitGuid;
      const dateRange = getDateRange(7); // Last 7 days
      
      console.log(`Fetching history from ${dateRange.from} to ${dateRange.to}`);
      const history = await api.units.getHistory(unitGuid, dateRange);
      console.log(`Received ${history.values?.length || 0} value series`);
    }

    // Example 2: Retry with exponential backoff
    console.log('\n--- Example 2: Retry with Backoff ---');
    const robustFetch = async () => {
      return await retryWithBackoff(
        async () => api.units.list(),
        3,  // max retries
        1000 // initial delay
      );
    };
    const unitsWithRetry = await robustFetch();
    console.log(`Successfully fetched ${unitsWithRetry.count} units with retry logic`);

    // Example 3: Batch processing multiple units
    console.log('\n--- Example 3: Batch Processing ---');
    const unitGuids = unitsList.units.slice(0, 3).map(u => u.unitGuid);
    
    const results = await batchProcess(
      unitGuids,
      async (guid) => {
        return await api.units.getValues(guid);
      },
      1500 // 1.5 second delay between requests
    );
    
    console.log('Batch processing results:');
    results.forEach(result => {
      if (result.success) {
        console.log(`✓ ${result.guid}: ${result.data.values?.length || 0} values`);
      } else {
        console.log(`✗ ${result.guid}: ${result.error}`);
      }
    });

    // Example 4: Finding value GUIDs by name
    console.log('\n--- Example 4: Find Value GUIDs ---');
    if (unitGuids.length > 0) {
      const values = await api.units.getValues(unitGuids[0]);
      
      const rpmGuid = findValueGuid(values, 'RPM');
      const voltageGuid = findValueGuid(values, 'voltage');
      
      console.log('RPM GUID:', rpmGuid || 'Not found');
      console.log('Voltage GUID:', voltageGuid || 'Not found');
      
      // Fetch history for specific values
      if (rpmGuid) {
        const dateRange = getDateRange(3);
        const rpmHistory = await api.units.getHistory(unitGuids[0], {
          ...dateRange,
          valueGuids: rpmGuid
        });
        console.log(`RPM history points: ${rpmHistory.values?.[0]?.history?.length || 0}`);
      }
    }

    console.log('\n✓ All examples completed successfully');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
  }
}

main();
