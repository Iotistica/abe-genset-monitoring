/**
 * Identity Resource
 * Handles authentication and application management for ComAp Cloud Identity
 */
class Identity {
  constructor(client) {
    this.client = client;
    this.baseURL = 'https://api.ABE.net/identity';
  }

  /**
   * Authenticate and get OAuth token
   * @param {string} clientId - Application client ID (GUID)
   * @param {string} secret - Application secret
   * @returns {Promise<Object>} Returns token object with access_token, token_type, expires_in
   * @note Rate limited to 5 requests per 5 minutes
   * @example
   * const token = await api.identity.authenticate(clientId, secret);
   * // Use token.access_token as Bearer token in API requests
   */
  async authenticate(clientId, secret) {
    // Create a temporary client for identity endpoint
    const identityClient = this.client.axiosInstance;
    const response = await identityClient.post(
      `${this.baseURL}/application/authenticate`,
      {
        clientId,
        secret
      }
    );
    return response;
  }

  /**
   * Get application registration for signed-in user
   * Returns client ID and registered secrets (without secret text)
   * @returns {Promise<Object>} Returns { client_id, secrets[] }
   */
  async getApplication() {
    const identityClient = this.client.axiosInstance;
    const response = await identityClient.get(`${this.baseURL}/application`);
    return response;
  }

  /**
   * Create application registration for signed-in identity
   * @returns {Promise<Object>} Returns { client_id }
   */
  async createApplication() {
    const identityClient = this.client.axiosInstance;
    const response = await identityClient.post(`${this.baseURL}/application`);
    return response;
  }

  /**
   * Delete application registration for signed-in identity
   * @returns {Promise<void>}
   */
  async deleteApplication() {
    const identityClient = this.client.axiosInstance;
    await identityClient.delete(`${this.baseURL}/application`);
  }

  /**
   * Create a new application secret
   * @param {string} clientId - Application client ID (GUID)
   * @param {Object} options - Secret options
   * @param {string} options.displayName - Optional friendly name for the secret
   * @param {string} options.duration - Optional duration (default: "2y", currently unsupported)
   * @returns {Promise<Object>} Returns secret object with secretId, displayName, secret, endDateTime, hint
   * @note Maximum 2 secrets per application
   * @note The secret text is only returned once during creation
   * @example
   * const secret = await api.identity.createSecret(clientId, {
   *   displayName: 'Production API Key'
   * });
   * console.log('Secret:', secret.secret); // Save this - won't be shown again!
   */
  async createSecret(clientId, options = {}) {
    const identityClient = this.client.axiosInstance;
    const response = await identityClient.post(
      `${this.baseURL}/application/createSecret`,
      {
        clientId,
        secret: {
          displayName: options.displayName,
          duration: options.duration || '2y'
        }
      }
    );
    return response;
  }

  /**
   * Delete an application secret
   * @param {string} clientId - Application client ID (GUID)
   * @param {string} secretId - Secret ID (GUID) to delete
   * @returns {Promise<void>}
   */
  async deleteSecret(clientId, secretId) {
    const identityClient = this.client.axiosInstance;
    await identityClient.post(
      `${this.baseURL}/application/deleteSecret`,
      {
        clientId,
        secret: {
          secretId
        }
      }
    );
  }
}

module.exports = Identity;
