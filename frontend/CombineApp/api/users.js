import apiClient from './client';
import { errorHandler } from '../utils';

/**
 * Change user password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const response = await apiClient.put('/users/changepassword', {
      oldPassword,
      newPassword
    });
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error);
    return { success: false, error: standardError };
  }
};
