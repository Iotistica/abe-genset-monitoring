require('dotenv').config();
const APIClient = require('./client');
const Units = require('./resources/units');
const Identity = require('./resources/identity');

/**
 * Alfa Balt API Client
 * Main entry point for Alfa Balt API v1.1 (ABE-compatible)
 */
class AlfalabaltAPI {
  /**
   * @param {Object} config - Configuration options
   * @param {string} config.loginId - Alfa Balt account login ID (optional if only using identity)
   * @param {string} config.accessToken - Bearer access token for authentication (optional if only using identity)
   * @param {string} config.comapKey - Subscription key from user profile (Comap-Key header)
   * @param {string} config.baseURL - Base URL for the API (default: https://api.ABE.net/v1.1)
   * @param {number} config.timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(config = {}) {
    this.config = {
      loginId: config.loginId || process.env.LOGIN_ID,
      accessToken: config.accessToken || process.env.ACCESS_TOKEN,
      comapKey: config.comapKey || process.env.COMAP_KEY,
      baseURL: config.baseURL || process.env.API_BASE_URL || 'https://api.ABE.net/v1.1',
      timeout: config.timeout || 30000
    };

    // Validate comapKey (always required)
    if (!this.config.comapKey) {
      throw new Error('comapKey (Comap-Key) is required');
    }

    // Initialize API client
    this.client = new APIClient(this.config);

    // Initialize resource endpoints
    this.identity = new Identity(this.client);
    
    // Units require loginId and accessToken
    if (this.config.loginId && this.config.accessToken) {
      this.units = new Units(this.client, this.config.loginId);
    }
  }

  /**
   * Test API connection by fetching units list
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      if (!this.units) {
        throw new Error('Units endpoint not available - loginId and accessToken required');
      }
      await this.units.list();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = AlfalabaltAPI;
