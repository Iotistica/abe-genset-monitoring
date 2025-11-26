/**
 * Units Resource
 * Handles unit-related API endpoints for ComAp ABE API v1.1
 */
class Units {
  constructor(client, loginId) {
    this.client = client;
    this.loginId = loginId;
  }

  /**
   * List all units under your account
   * @returns {Promise<Object>} Returns { count: number, units: Array<{name, unitGuid, url}> }
   */
  async list() {
    return this.client.get(`/${this.loginId}/units`);
  }

  /**
   * Get unit basic information
   * @param {string} unitGuid - Unique unit identifier
   * @returns {Promise<Object>} Returns unit info including name, timezone, connection, position
   */
  async getInfo(unitGuid) {
    return this.client.get(`/${this.loginId}/units/${unitGuid}/info`);
  }

  /**
   * Get unit values/measurements
   * @param {string} unitGuid - Unique unit identifier
   * @param {Object} params - Query parameters
   * @param {string} params.valueGuids - Comma-separated value GUIDs (optional, omit to get all)
   * @returns {Promise<Object>} Returns unit values with timestamps
   */
  async getValues(unitGuid, params = {}) {
    return this.client.get(`/${this.loginId}/units/${unitGuid}/values`, params);
  }

  /**
   * Get unit permissions
   * @param {string} unitGuid - Unique unit identifier
   * @returns {Promise<Object>} Returns list of users and their permissions
   */
  async getPermissions(unitGuid) {
    return this.client.get(`/${this.loginId}/units/${unitGuid}/permissions`);
  }

  /**
   * Get unit historical data
   * @param {string} unitGuid - Unique unit identifier
   * @param {Object} params - Query parameters
   * @param {string} params.from - Start date in MM/DD/YYYY format
   * @param {string} params.to - End date in MM/DD/YYYY format
   * @param {string} params.offset - Offset for pagination (default: 0)
   * @param {string} params.valueGuids - Comma-separated value GUIDs
   * @returns {Promise<Object>} Returns historical values with validity periods
   * @note Maximum 31 days range, response limited to 200KB, use offset for pagination
   * @note Rate limit: 1 request per second (60 per rolling 60-second window)
   */
  async getHistory(unitGuid, params = {}) {
    return this.client.get(`/${this.loginId}/units/${unitGuid}/history`, params);
  }

  /**
   * Send command to unit
   * @param {string} unitGuid - Unique unit identifier
   * @param {Object} command - Command object
   * @param {string} command.command - Command type (start, stop, faultReset, changeMcb, changeGcb, etc.)
   * @param {string} command.mode - Mode for changeMode command (off, man, aut, test)
   * @param {number} command.index - Index for userButton, remoteSwitch, extValue, setTimer
   * @param {string} command.action - Action for userButton/remoteSwitch (start, stop, toggle, pulse)
   * @param {number|string} command.value - Value for extValue or changeSetpoint
   * @param {string} command.guid - GUID for changeSetpoint
   * @returns {Promise<Object>}
   * @example
   * // Start unit
   * await units.sendCommand(unitGuid, { command: 'start' });
   * 
   * // Change mode
   * await units.sendCommand(unitGuid, { command: 'changeMode', mode: 'man' });
   * 
   * // User button
   * await units.sendCommand(unitGuid, { command: 'userButton', index: 1, action: 'start' });
   * 
   * // Set external value
   * await units.sendCommand(unitGuid, { command: 'extValue', index: 1, value: 100 });
   */
  async sendCommand(unitGuid, command) {
    return this.client.post(`/${this.loginId}/units/${unitGuid}/command`, command);
  }

  /**
   * Get unit comments
   * @param {string} unitGuid - Unique unit identifier
   * @returns {Promise<Object>} Returns array of comments with id, author, date, text, active
   */
  async getComments(unitGuid) {
    return this.client.get(`/${this.loginId}/units/${unitGuid}/comments`);
  }

  /**
   * Get list of files stored in the unit
   * @param {string} unitGuid - Unique unit identifier
   * @returns {Promise<Object>} Returns list of files with fileName, fileType, generated timestamp
   */
  async getFiles(unitGuid) {
    return this.client.get(`/${this.loginId}/units/${unitGuid}/files`);
  }

  /**
   * Download a file from the unit
   * @param {string} unitGuid - Unique unit identifier
   * @param {string} fileName - Name of the file to download
   * @returns {Promise<Object>} Returns file content
   */
  async downloadFile(unitGuid, fileName) {
    return this.client.get(`/${this.loginId}/unit/${unitGuid}/download/${fileName}`);
  }
}

module.exports = Units;
