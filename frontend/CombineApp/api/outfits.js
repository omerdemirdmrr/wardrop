import apiClient from './client';
import { errorHandler } from '../utils';

const OUTFITS_ENDPOINT = '/outfits';

export const generateOutfit = async (params = {}) => {
  try {
    const response = await apiClient.post(`${OUTFITS_ENDPOINT}/generate`, params);
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'generateOutfit' });
    return { success: false, error: standardError };
  }
};

export const updateOutfitStatus = async (outfitId, status) => {
  try {
    const response = await apiClient.put(`${OUTFITS_ENDPOINT}/status/${outfitId}`, { status });
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'updateOutfitStatus', outfitId });
    return { success: false, error: standardError };
  }
};

export const getUserOutfits = async () => {
  try {
    const response = await apiClient.get(OUTFITS_ENDPOINT);
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'getUserOutfits' });
    return { success: false, error: standardError };
  }
};

export const deleteOutfit = async (outfitId) => {
  try {
    const response = await apiClient.delete(`${OUTFITS_ENDPOINT}/delete/${outfitId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'deleteOutfit', outfitId });
    return { success: false, error: standardError };
  }
};

export const createOutfit = async (name, items, description = '') => {
  try {
    const response = await apiClient.post(`${OUTFITS_ENDPOINT}/add`, { name, items, description });
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'createOutfit' });
    return { success: false, error: standardError };
  }
};

export const clearDislikedOutfits = async () => {
  try {
    const response = await apiClient.delete(`${OUTFITS_ENDPOINT}/disliked`);
    return { success: true, data: response.data };
  } catch (error) {
    const standardError = errorHandler.handleApiError(error, { operation: 'clearDislikedOutfits' });
    return { success: false, error: standardError };
  }
};
