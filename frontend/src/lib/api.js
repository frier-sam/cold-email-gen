// frontend/src/lib/api.js

const API_URL = "http://localhost:8000/api";

/**
 * Generic fetch function with authentication
 */

export const tasks = {
  generateEmails: async (data) => {
    return fetchAPI("/tasks/generate-emails", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  getStatus: async (taskId) => {
    return fetchAPI(`/tasks/status/${taskId}`);
  },
  
  saveEmail: async (data) => {
    return fetchAPI("/tasks/save-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "An error occurred while fetching the data.",
    }));
    throw new Error(error.detail || "An error occurred");
  }
  
  return response.json();
};

/**
 * Auth API calls
 */
export const auth = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Login failed. Please check your credentials.",
      }));
      throw new Error(error.detail || "Login failed");
    }
    
    return response.json();
  },
  
  register: async (email, username, password) => {
    return fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        username,
        password,
      }),
    });
  },
  
  getCurrentUser: async () => {
    return fetchAPI("/users/me");
  },
  
};
/**
 * User API calls
 */
export const users = {
  // ... existing methods
  
  getStats: async () => {
    return fetchAPI("/users/stats");
  },
};

/**
 * Company API calls
 */
export const companies = {
  getAll: async () => {
    return fetchAPI("/companies");
  },
  
  getById: async (id) => {
    return fetchAPI(`/companies/${id}`);
  },
  
  create: async (companyData) => {
    return fetchAPI("/companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  },
  
  update: async (id, companyData) => {
    return fetchAPI(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
  },
  
  delete: async (id) => {
    return fetchAPI(`/companies/${id}`, {
      method: "DELETE",
    });
  },
};

/**
 * Email API calls
 */
export const emails = {
  getAll: async () => {
    return fetchAPI("/emails");
  },
  
  getById: async (id) => {
    return fetchAPI(`/emails/${id}`);
  },
  
  generate: async (emailData) => {
    return fetchAPI("/emails", {
      method: "POST",
      body: JSON.stringify(emailData),
    });
  },
  
  delete: async (id) => {
    return fetchAPI(`/emails/${id}`, {
      method: "DELETE",
    });
  },
  getByCompany: async (companyId) => {
    return fetchAPI(`/emails/company/${companyId}`);
  },
};