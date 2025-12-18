import apiClient from './client';

const OUTFITS_ENDPOINT = '/outfits';

/**
 * Calls the backend to generate a new outfit using AI.
 * The backend handles user context and exclusion lists automatically.
 * @returns {Promise<object>} A promise that resolves with the API response.
 */
export const generateOutfit = (params = {}) => {
    return apiClient.post(`${OUTFITS_ENDPOINT}/generate`, params);
};

/**
 * Updates the status of a specific outfit.
 * @param {string} outfitId The ID of the outfit to update.
 * @param {string} status The new status ('worn', 'disliked').
 * @returns {Promise<object>} A promise that resolves with the API response.
 */
export const updateOutfitStatus = (outfitId, status) => {
    return apiClient.put(`${OUTFITS_ENDPOINT}/status/${outfitId}`, { status });
};

/**
 * Fetches all outfits for the user.
 * @returns {Promise<object>} A promise that resolves with the API response.
 */
export const getUserOutfits = () => {
    return apiClient.get(OUTFITS_ENDPOINT);
};

/**
 * Deletes a specific outfit.
 * @param {string} outfitId The ID of the outfit to delete.
 * @returns {Promise<object>} A promise that resolves with the API response.
 */
export const deleteOutfit = (outfitId) => {
    return apiClient.delete(`${OUTFITS_ENDPOINT}/${outfitId}`);
};

/**
 * Deletes all disliked outfits.
 * @returns {Promise<object>} A promise that resolves with the API response.
 */
export const clearDislikedOutfits = () => {
    return apiClient.delete(`${OUTFITS_ENDPOINT}/disliked`);
};
