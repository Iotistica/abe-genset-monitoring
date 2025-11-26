require('dotenv').config();
const ABEAPI = require('../src/index');

/**
 * Basic usage examples for ComAp ABE API v1.1
 */
async function main() {
  // Initialize API client
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY,
    baseURL: process.env.API_BASE_URL
  });

  try {
    console.log('Testing API connection...');
    const isConnected = await api.testConnection();
    console.log('Connection:', isConnected ? 'Success' : 'Failed');

    // Example 1: List all units
    console.log('\n--- Units ---');
    const unitsList = await api.units.list();
    console.log(`Found ${unitsList.count} units`);
    console.log(JSON.stringify(unitsList.units, null, 2));

    if (unitsList.units && unitsList.units.length > 0) {
      const firstUnit = unitsList.units[0];
      const unitGuid = firstUnit.unitGuid;
      
      // Example 2: Get unit info
      console.log(`\n--- Unit Info: ${firstUnit.name} ---`);
      const info = await api.units.getInfo(unitGuid);
      console.log(JSON.stringify(info, null, 2));

      // Example 3: Get unit values
      console.log('\n--- Unit Values ---');
      const values = await api.units.getValues(unitGuid);
      console.log(JSON.stringify(values, null, 2));

      // Example 4: Get specific values (if you know the GUIDs)
      // const specificValues = await api.units.getValues(unitGuid, {
      //   valueGuids: '6629f84f-4b79-43c2-ab33-1f27f1f8c42b,0C9117DA-495A-11DF-85EB-428556D89593'
      // });

      // Example 5: Get unit permissions
      console.log('\n--- Unit Permissions ---');
      const permissions = await api.units.getPermissions(unitGuid);
      console.log(JSON.stringify(permissions, null, 2));

      // Example 6: Get unit comments
      console.log('\n--- Unit Comments ---');
      const comments = await api.units.getComments(unitGuid);
      console.log(JSON.stringify(comments, null, 2));

      // Example 7: Get unit files
      console.log('\n--- Unit Files ---');
      const files = await api.units.getFiles(unitGuid);
      console.log(JSON.stringify(files, null, 2));

      // Example 8: Get historical data (last 7 days)
      console.log('\n--- Historical Data ---');
      const toDate = new Date();
      const fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const history = await api.units.getHistory(unitGuid, {
        from: `${fromDate.getMonth() + 1}/${fromDate.getDate()}/${fromDate.getFullYear()}`,
        to: `${toDate.getMonth() + 1}/${toDate.getDate()}/${toDate.getFullYear()}`,
        offset: '0'
      });
      console.log(JSON.stringify(history, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.status) {
      console.error('Status code:', error.status);
    }
    if (error.data) {
      console.error('Error details:', error.data);
    }
  }
}

// Run examples
main();
