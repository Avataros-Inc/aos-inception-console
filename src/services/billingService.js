import { API_BASE_URL } from '../postgrestAPI';
import { getSessionToken } from '../postgrestAPI';

export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/billing/products`, {
    headers: {
      Authorization: `Bearer ${getSessionToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to fetch products');
    error.status = response.status;
    throw error;
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
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to fetch usage data');
    error.status = response.status;
    throw error;
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
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to fetch user plan');
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const resendVerificationEmail = async () => {
  const response = await fetch(`${API_BASE_URL}/resend-verification-email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSessionToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to resend verification email');
    error.status = response.status;
    throw error;
  }

  return response.json();
};
