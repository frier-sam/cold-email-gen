// frontend/src/lib/utils.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx for conditional classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
}

/**
 * Format time in a readable format
 */
export function formatTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

/**
 * Handle authentication token storage
 */
export const authUtils = {
  setToken: (token) => {
    localStorage.setItem("token", token);
  },
  
  getToken: () => {
    return localStorage.getItem("token");
  },
  
  removeToken: () => {
    localStorage.removeItem("token");
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

/**
 * Truncate text to a specific length
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Convert an array of objects to a comma-separated string
 */
export function joinArrayOfObjects(array, key, separator = ", ") {
  if (!array || !array.length) return "";
  return array.map((item) => item[key]).join(separator);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url) {
  if (!url) return "";
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}