# ABE API Commands Reference

Complete reference for all available commands that can be sent to units via the API.

## Basic Commands

### Start
Starts the engine.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'start'
});
```

### Stop
Stops the engine.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'stop'
});
```

### Fault Reset
Resets fault conditions.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'faultReset'
});
```

## Circuit Breaker Commands

### Change Mains Circuit Breaker (MCB)
Toggles the Mains circuit breaker.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'changeMcb'
});
```

### Change Genset Circuit Breaker (GCB)
Toggles the Genset circuit breaker.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'changeGcb'
});
```

## Mode Commands

### Change Mode
Changes the operating mode of the controller.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'changeMode',
  mode: 'man' // Options: 'off', 'man', 'aut', 'test'
});
```

**Available modes:**
- `off` - Off mode
- `man` - Manual mode
- `aut` - Automatic mode
- `test` - Test mode

To get the list of available modes for your specific controller, check value GUID `49424e2b-1009-471c-b8e3-3e84e9c16159`.

## Button Commands

### Sensor Button
Triggers the sensor button (supported only by special branch of controllers).

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'sensorButton'
});
```

### Timer Button
Triggers the timer button (supported only by special branch of controllers).

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'timerButton'
});
```

### User Button
Triggers a user-defined button (1-32).

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'userButton',
  index: 2,          // Button index (1-32)
  action: 'start'    // Actions: 'start', 'stop', 'toggle', 'pulse'
});
```

**Available actions:**
- `start` - Activate/start the button action
- `stop` - Deactivate/stop the button action
- `toggle` - Toggle the button state
- `pulse` - Send a momentary pulse

## Remote Control

### Remote Switch
Controls a remote switch (1-8).

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'remoteSwitch',
  index: 1,        // Switch index (1-8)
  action: 'start'  // Actions: 'start', 'stop'
});
```

**Available actions:**
- `start` - Activate the switch
- `stop` - Deactivate the switch

## Value Commands

### External Value
Sets an external value (1-4).

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'extValue',
  index: 3,    // Value index (1-4)
  value: 100   // Numerical value
});
```

### Change Setpoint
Changes a setpoint value by its GUID.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'changeSetpoint',
  guid: '7b2ae258-65a8-40dd-bb42-5455753679f9',
  value: 'MyController' // Can be string or number (case sensitive for strings)
});
```

## Timer Commands

### Set Timer
Configures timer settings (1-2). The timer can be configured in multiple modes.

#### Timer Mode: Off
Disables the timer.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Off'
  }
});
```

#### Timer Mode: Once
Executes the timer once at a specific time.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Once',
    from: 1601286038000,  // UNIX epoch time in milliseconds
    duration: 60           // Duration in minutes
  }
});
```

#### Timer Mode: Daily
Repeats every X days.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Daily',
    from: 1601286038000,
    duration: 60,
    setupDaily: {
      dayRepeat: 1,                    // Repeat every X day
      dayWeekend: 'Included'           // 'Included', 'Except', 'nextDayAfter'
    }
  }
});
```

**Weekend handling options:**
- `Included` - Include weekends
- `Except` - Exclude weekends
- `nextDayAfter` - Move to next weekday after weekend

#### Timer Mode: Weekly
Repeats on specific days of the week.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Weekly',
    from: 1601286038000,
    duration: 60,
    setupWeekly: {
      weekRepeat: 2,                    // Repeat every X weeks
      weekDays: [                       // Days to execute
        'Monday',
        'Wednesday',
        'Friday',
        'Sunday'
      ]
    }
  }
});
```

**Available days:** `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

#### Timer Mode: Monthly
Repeats on a specific day of the month.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Monthly',
    from: 1601286038000,
    duration: 60,
    setupMonthly: {
      monthRepeat: 1,     // Repeat every X months
      dayInMonth: 15      // Day of month (1-31)
    }
  }
});
```

#### Timer Mode: MonthlyDays
Repeats on specific days within specific weeks of the month.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'MonthlyDays',
    from: 1601286038000,
    duration: 60,
    setupMonthlyDays: {
      monthRepeat: 1,        // Repeat every X months
      weekInMonth: 2,        // Which week of the month (1-5)
      weekDays: [            // Days within that week
        'Monday',
        'Friday'
      ]
    }
  }
});
```

#### Timer Mode: Period
Repeats at a fixed interval in minutes.

```javascript
await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Period',
    from: 1601286038000,
    duration: 60,
    setupPeriod: {
      minutesRepeat: 120   // Repeat every X minutes
    }
  }
});
```

## Complete Examples

### Example 1: Complete Startup Sequence

```javascript
// Set mode to manual
await api.units.sendCommand(unitGuid, {
  command: 'changeMode',
  mode: 'man'
});

// Wait a moment
await new Promise(resolve => setTimeout(resolve, 2000));

// Start the unit
await api.units.sendCommand(unitGuid, {
  command: 'start'
});

// Close the genset circuit breaker after startup
await new Promise(resolve => setTimeout(resolve, 5000));
await api.units.sendCommand(unitGuid, {
  command: 'changeGcb'
});
```

### Example 2: Scheduled Maintenance

```javascript
// Set up a weekly maintenance timer
// Runs every Monday at 2 AM for 30 minutes
const nextMonday = new Date();
nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
nextMonday.setHours(2, 0, 0, 0);

await api.units.sendCommand(unitGuid, {
  command: 'setTimer',
  index: 1,
  action: {
    mode: 'Weekly',
    from: nextMonday.getTime(),
    duration: 30,
    setupWeekly: {
      weekRepeat: 1,
      weekDays: ['Monday']
    }
  }
});
```

### Example 3: Emergency Shutdown

```javascript
// Immediate stop with fault reset
await api.units.sendCommand(unitGuid, {
  command: 'stop'
});

await new Promise(resolve => setTimeout(resolve, 1000));

await api.units.sendCommand(unitGuid, {
  command: 'faultReset'
});
```

## Error Handling

Always wrap commands in try-catch blocks:

```javascript
try {
  await api.units.sendCommand(unitGuid, {
    command: 'start'
  });
  console.log('Command sent successfully');
} catch (error) {
  if (error.status === 400) {
    console.error('Invalid command or parameters');
  } else if (error.status === 401) {
    console.error('Authentication failed');
  } else {
    console.error('Command failed:', error.message);
  }
}
```

## Notes

- Commands are sent asynchronously and may take time to execute on the controller
- Always verify the command result by checking unit values/status after sending
- Some commands may not be available depending on controller configuration
- String values in `changeSetpoint` are case-sensitive
- Be cautious when sending control commands as they affect real equipment
