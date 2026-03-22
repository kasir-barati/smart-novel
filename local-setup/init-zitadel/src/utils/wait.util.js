// @ts-check

import { Logger } from './logger.util.js';

/**
 * Utility for waiting and retrying operations
 */
export class WaitUtil {
  /**
   * Wait for ZITADEL to be ready by checking the health endpoint
   * @param {string} zitadelUrl - ZITADEL base URL
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<void>}
   */
  static async waitForZitadel(zitadelUrl, maxRetries = 30) {
    Logger.log('Waiting for ZITADEL to accept HTTP requests...');

    for (let retries = 0; retries < maxRetries; retries++) {
      try {
        const response = await fetch(`${zitadelUrl}/debug/ready`);
        if (response.ok) {
          Logger.ok('ZITADEL is ready');
          return;
        }
      } catch (error) {
        // Service not ready yet
      }

      await this.sleep(2000);
    }

    Logger.error('ZITADEL did not become ready in time');
    throw new Error('ZITADEL health check timeout');
  }

  /**
   * Verify PAT token with retries
   * @param {string} zitadelUrl - ZITADEL base URL
   * @param {string} accessToken - Access token to verify
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<void>}
   */
  static async verifyPatWithRetries(
    zitadelUrl,
    accessToken,
    maxRetries = 30,
  ) {
    Logger.log('Verifying PAT...');

    for (let retries = 0; retries < maxRetries; retries++) {
      const response = await fetch(`${zitadelUrl}/auth/v1/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        Logger.ok('PAT is valid');
        return;
      }

      if (retries === 0) {
        Logger.log(
          `PAT verification returned HTTP ${response.status}, waiting for ZITADEL services to be fully ready...`,
        );
      }

      await this.sleep(2000);
    }

    Logger.error(
      `PAT verification failed after ${maxRetries} attempts`,
    );
    throw new Error('PAT verification failed');
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
