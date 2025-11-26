require('dotenv').config();
const ABEAPI = require('../src/index');

/**
 * Example: Real-time monitoring of units
 */
class MonitoringService {
  constructor(api) {
    this.api = api;
    this.monitoringInterval = null;
    this.unitGuids = [];
  }

  /**
   * Initialize monitoring with available units
   */
  async initialize() {
    const unitsList = await this.api.units.list();
    if (unitsList.units && unitsList.units.length > 0) {
      this.unitGuids = unitsList.units.slice(0, 5).map(u => ({
        guid: u.unitGuid,
        name: u.name
      }));
      console.log(`Initialized monitoring for ${this.unitGuids.length} units`);
      this.unitGuids.forEach(u => console.log(`  - ${u.name}`));
    } else {
      throw new Error('No units available for monitoring');
    }
  }

  /**
   * Start monitoring
   * @param {number} intervalMs - Polling interval in milliseconds
   */
  startMonitoring(intervalMs = 10000) {
    console.log(`\nStarting monitoring (interval: ${intervalMs}ms)...`);
    console.log('Press Ctrl+C to stop\n');
    
    // Check immediately
    this.checkStatus();
    
    // Then check at intervals
    this.monitoringInterval = setInterval(async () => {
      await this.checkStatus();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      console.log('\nMonitoring stopped');
    }
  }

  /**
   * Check system status
   */
  async checkStatus() {
    try {
      const timestamp = new Date().toISOString();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${timestamp}] Monitoring Status`);
      console.log('='.repeat(60));

      for (const unit of this.unitGuids) {
        try {
          // Get unit values
          const values = await this.api.units.getValues(unit.guid);
          
          console.log(`\n📊 ${unit.name} (${unit.guid})`);
          
          if (values.values && values.values.length > 0) {
            // Display key values (first 5)
            const keyValues = values.values.slice(0, 5);
            keyValues.forEach(v => {
              const valueStr = typeof v.value === 'number' 
                ? `${v.value}${v.unit ? ' ' + v.unit : ''}`
                : v.value;
              console.log(`   ${v.name}: ${valueStr}`);
            });
            
            // Show last update time
            const lastUpdate = values.values.find(v => v.name === 'Last Update');
            if (lastUpdate) {
              const updateTime = new Date(lastUpdate.value);
              const minutesAgo = Math.floor((Date.now() - updateTime.getTime()) / 60000);
              console.log(`   ⏱️  Last update: ${minutesAgo} minute(s) ago`);
            }
          } else {
            console.log('   ⚠️  No values available');
          }

          // Small delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.log(`   ❌ Error monitoring ${unit.name}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('Monitoring error:', error.message);
    }
  }
}

async function main() {
  const api = new ABEAPI({
    loginId: process.env.LOGIN_ID,
    accessToken: process.env.ACCESS_TOKEN,
    comapKey: process.env.COMAP_KEY,
    baseURL: process.env.API_BASE_URL
  });

  const monitor = new MonitoringService(api);
  
  try {
    // Initialize with available units
    await monitor.initialize();
    
    // Start monitoring
    monitor.startMonitoring(30000); // Check every 30 seconds
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nReceived SIGINT, stopping monitoring...');
      monitor.stopMonitoring();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
