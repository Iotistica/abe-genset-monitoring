/**
 * Utility helpers for working with ABE API
 */

/**
 * Format date for API (MM/DD/YYYY)
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted date string
 */
function formatDateForAPI(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Get date range for last N days
 * @param {number} days - Number of days (max 31)
 * @returns {Object} { from, to } date strings
 */
function getDateRange(days = 7) {
  if (days > 31) {
    throw new Error('Maximum date range is 31 days');
  }
  
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  
  return {
    from: formatDateForAPI(from),
    to: formatDateForAPI(to)
  };
}

/**
 * Create a timer configuration object
 * @param {string} mode - Timer mode (Once, Daily, Weekly, Monthly, MonthlyDays, Period)
 * @param {Object} options - Timer options
 * @returns {Object} Timer configuration
 */
function createTimerConfig(mode, options) {
  const config = { mode };

  switch (mode) {
    case 'Off':
      return config;

    case 'Once':
      if (!options.from || !options.duration) {
        throw new Error('Once mode requires: from (timestamp), duration (minutes)');
      }
      return { ...config, from: options.from, duration: options.duration };

    case 'Daily':
      if (!options.from || !options.duration || !options.setupDaily) {
        throw new Error('Daily mode requires: from, duration, setupDaily');
      }
      return { 
        ...config, 
        from: options.from, 
        duration: options.duration,
        setupDaily: {
          dayRepeat: options.setupDaily.dayRepeat || 1,
          dayWeekend: options.setupDaily.dayWeekend || 'Included'
        }
      };

    case 'Weekly':
      if (!options.from || !options.duration || !options.setupWeekly) {
        throw new Error('Weekly mode requires: from, duration, setupWeekly');
      }
      return { 
        ...config, 
        from: options.from, 
        duration: options.duration,
        setupWeekly: {
          weekRepeat: options.setupWeekly.weekRepeat || 1,
          weekDays: options.setupWeekly.weekDays || []
        }
      };

    case 'Monthly':
      if (!options.from || !options.duration || !options.setupMonthly) {
        throw new Error('Monthly mode requires: from, duration, setupMonthly');
      }
      return { 
        ...config, 
        from: options.from, 
        duration: options.duration,
        setupMonthly: {
          monthRepeat: options.setupMonthly.monthRepeat || 1,
          dayInMonth: options.setupMonthly.dayInMonth
        }
      };

    case 'MonthlyDays':
      if (!options.from || !options.duration || !options.setupMonthlyDays) {
        throw new Error('MonthlyDays mode requires: from, duration, setupMonthlyDays');
      }
      return { 
        ...config, 
        from: options.from, 
        duration: options.duration,
        setupMonthlyDays: {
          monthRepeat: options.setupMonthlyDays.monthRepeat || 1,
          weekInMonth: options.setupMonthlyDays.weekInMonth,
          weekDays: options.setupMonthlyDays.weekDays || []
        }
      };

    case 'Period':
      if (!options.from || !options.duration || !options.setupPeriod) {
        throw new Error('Period mode requires: from, duration, setupPeriod');
      }
      return { 
        ...config, 
        from: options.from, 
        duration: options.duration,
        setupPeriod: {
          minutesRepeat: options.setupPeriod.minutesRepeat
        }
      };

    default:
      throw new Error(`Unknown timer mode: ${mode}`);
  }
}

/**
 * Parse historical data into time-series format
 * @param {Object} historyResponse - Response from getHistory()
 * @returns {Array} Array of {timestamp, values} objects
 */
function parseHistoricalData(historyResponse) {
  if (!historyResponse.values || historyResponse.values.length === 0) {
    return [];
  }

  const timeSeriesMap = new Map();

  // Process each value's history
  historyResponse.values.forEach(valueObj => {
    const valueName = valueObj.name;
    const valueUnit = valueObj.unit;

    valueObj.history.forEach(historyPoint => {
      const timestamp = historyPoint.validTo;
      
      if (!timeSeriesMap.has(timestamp)) {
        timeSeriesMap.set(timestamp, { timestamp, values: {} });
      }

      const entry = timeSeriesMap.get(timestamp);
      entry.values[valueName] = {
        value: historyPoint.value,
        unit: valueUnit
      };
    });
  });

  // Convert map to sorted array
  return Array.from(timeSeriesMap.values())
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise}
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Batch process units with rate limiting
 * @param {Array} unitGuids - Array of unit GUIDs
 * @param {Function} processFn - Async function to process each unit
 * @param {number} delayMs - Delay between requests in milliseconds
 * @returns {Promise<Array>} Results array
 */
async function batchProcess(unitGuids, processFn, delayMs = 1000) {
  const results = [];
  
  for (let i = 0; i < unitGuids.length; i++) {
    try {
      const result = await processFn(unitGuids[i], i);
      results.push({ guid: unitGuids[i], success: true, data: result });
    } catch (error) {
      results.push({ 
        guid: unitGuids[i], 
        success: false, 
        error: error.message 
      });
    }
    
    // Add delay between requests (except after last one)
    if (i < unitGuids.length - 1) {
      await sleep(delayMs);
    }
  }
  
  return results;
}

/**
 * Find value GUID by name
 * @param {Object} valuesResponse - Response from getValues()
 * @param {string} valueName - Name of the value to find
 * @returns {string|null} Value GUID or null if not found
 */
function findValueGuid(valuesResponse, valueName) {
  if (!valuesResponse.values) return null;
  
  const value = valuesResponse.values.find(v => 
    v.name.toLowerCase() === valueName.toLowerCase()
  );
  
  return value ? value.valueGuid : null;
}

module.exports = {
  formatDateForAPI,
  getDateRange,
  createTimerConfig,
  parseHistoricalData,
  sleep,
  retryWithBackoff,
  batchProcess,
  findValueGuid
};
