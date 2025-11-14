import { API_BASE_URL } from '../postgrestAPI';
import { getSessionToken } from '../postgrestAPI';

export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/billing/products`, {
    headers: {
      Authorization: `Bearer ${getSessionToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
};

export const getUsage = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/billing/usage`, {
    headers: {
      Authorization: `Bearer ${getSessionToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch usage data');
  }

  return response.json();
};

export const getUserPlan = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/billing/subscription`, {
    headers: {
      Authorization: `Bearer ${getSessionToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user plan');
  }

  return response.json();
};
