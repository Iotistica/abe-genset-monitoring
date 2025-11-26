require('dotenv').config();
const ABEAPI = require('../src/index');

/**
 * Example: Sending commands to units
 */
async function sendCommands() {
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY,
    baseURL: process.env.API_BASE_URL
  });

  try {
    // Get available units
    const unitsList = await api.units.list();
    console.log(`Found ${unitsList.count} units`);

    if (!unitsList.units || unitsList.units.length === 0) {
      console.log('No units available');
      return;
    }

    const unit = unitsList.units[0];
    const unitGuid = unit.unitGuid;
    console.log(`\nWorking with unit: ${unit.name} (${unitGuid})`);

    // Get current values before commanding
    console.log('\n--- Current Values ---');
    const currentValues = await api.units.getValues(unitGuid);
    console.log(JSON.stringify(currentValues, null, 2));

    // Example commands (CAUTION: These will actually control the unit!)
    // Uncomment only the commands you want to execute
    
    // Command 1: Start unit
    // console.log('\nSending START command...');
    // const startResult = await api.units.sendCommand(unitGuid, {
    //   command: 'start'
    // });
    // console.log('Result:', JSON.stringify(startResult, null, 2));

    // Command 2: Stop unit
    // console.log('\nSending STOP command...');
    // const stopResult = await api.units.sendCommand(unitGuid, {
    //   command: 'stop'
    // });
    // console.log('Result:', JSON.stringify(stopResult, null, 2));

    // Command 3: Fault reset
    // console.log('\nSending FAULT RESET command...');
    // const resetResult = await api.units.sendCommand(unitGuid, {
    //   command: 'faultReset'
    // });
    // console.log('Result:', JSON.stringify(resetResult, null, 2));

    // Command 4: Change mode
    // console.log('\nChanging mode to MANUAL...');
    // const modeResult = await api.units.sendCommand(unitGuid, {
    //   command: 'changeMode',
    //   mode: 'man' // off, man, aut, test
    // });
    // console.log('Result:', JSON.stringify(modeResult, null, 2));

    // Command 5: Toggle Mains Circuit Breaker
    // console.log('\nToggling Mains Circuit Breaker...');
    // const mcbResult = await api.units.sendCommand(unitGuid, {
    //   command: 'changeMcb'
    // });
    // console.log('Result:', JSON.stringify(mcbResult, null, 2));

    // Command 6: Toggle Genset Circuit Breaker
    // console.log('\nToggling Genset Circuit Breaker...');
    // const gcbResult = await api.units.sendCommand(unitGuid, {
    //   command: 'changeGcb'
    // });
    // console.log('Result:', JSON.stringify(gcbResult, null, 2));

    // Command 7: User button
    // console.log('\nTriggering User Button 1...');
    // const buttonResult = await api.units.sendCommand(unitGuid, {
    //   command: 'userButton',
    //   index: 1,
    //   action: 'pulse' // start, stop, toggle, pulse
    // });
    // console.log('Result:', JSON.stringify(buttonResult, null, 2));

    // Command 8: Set external value
    // console.log('\nSetting external value 1 to 100...');
    // const extValueResult = await api.units.sendCommand(unitGuid, {
    //   command: 'extValue',
    //   index: 1,
    //   value: 100
    // });
    // console.log('Result:', JSON.stringify(extValueResult, null, 2));

    // Command 9: Remote switch
    // console.log('\nActivating remote switch 1...');
    // const switchResult = await api.units.sendCommand(unitGuid, {
    //   command: 'remoteSwitch',
    //   index: 1,
    //   action: 'start' // start, stop
    // });
    // console.log('Result:', JSON.stringify(switchResult, null, 2));

    // Command 10: Change setpoint (replace guid with actual value GUID)
    // console.log('\nChanging setpoint...');
    // const setpointResult = await api.units.sendCommand(unitGuid, {
    //   command: 'changeSetpoint',
    //   guid: '7b2ae258-65a8-40dd-bb42-5455753679f9',
    //   value: 'NewValue' // Can be string or number
    // });
    // console.log('Result:', JSON.stringify(setpointResult, null, 2));

    // Command 11: Set timer (once)
    // const futureTime = Date.now() + 3600000; // 1 hour from now
    // console.log('\nSetting timer 1...');
    // const timerResult = await api.units.sendCommand(unitGuid, {
    //   command: 'setTimer',
    //   index: 1,
    //   action: {
    //     mode: 'once',
    //     from: futureTime,
    //     duration: 60 // minutes
    //   }
    // });
    // console.log('Result:', JSON.stringify(timerResult, null, 2));

    console.log('\n⚠️  All commands are commented out for safety.');
    console.log('Uncomment the commands you want to execute in commands.js');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.status) {
      console.error('Status code:', error.status);
    }
    if (error.data) {
      console.error('Details:', error.data);
    }
  }
}

sendCommands();
