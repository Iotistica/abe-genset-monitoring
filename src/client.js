const axios = require('axios');

/**
 * Base API Client
 * Handles HTTP requests and authentication
 */
class APIClient {
  constructor(config) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add Bearer token and Comap-Key to headers
        if (this.config.accessToken) {
          config.headers['Authorization'] = `Bearer ${this.config.accessToken}`;
        }
        if (this.config.comapKey) {
          config.headers['Comap-Key'] = this.config.comapKey;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error status
          const apiError = new Error(
            error.response.data.message || 
            error.response.statusText || 
            'API request failed'
          );
          apiError.status = error.response.status;
          apiError.data = error.response.data;
          throw apiError;
        } else if (error.request) {
          // Request made but no response
          throw new Error('No response from server');
        } else {
          // Request setup error
          throw new Error(error.message);
        }
      }
    );
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    return this.axiosInstance.get(endpoint, { params });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.axiosInstance.post(endpoint, data);
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.axiosInstance.put(endpoint, data);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    return this.axiosInstance.patch(endpoint, data);
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.axiosInstance.delete(endpoint);
  }
}

module.exports = APIClient;
