import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance with default config
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication functions
export const login = async (username, password) => {
  const response = await axios.post(`${apiUrl}/auth/login`, { username, password });
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// Registration disabled for security - users must be created by admin

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const getRecipes = async (all = true) => {
  const query = all ? '' : '?active=true';
  const response = await api.get(`/recipes${query}`);
  return response.data;
};

export const getPurveyors = async () => {
  const response = await api.get('/purveyors');
  return response.data;
};

export const createPurveyor = async (purveyor) => {
  const response = await api.post('/purveyors', purveyor);
  return response.data;
};

export const updatePurveyor = async (id, name) => {
  const response = await api.put(`/purveyors/${id}`, { name });
  return response.data;
};

export const deletePurveyor = async (id) => {
  const response = await api.delete(`/purveyors/${id}`);
  return response.data;
};

export const getIngredients = async () => {
  const response = await api.get('/ingredients');
  return response.data;
};

export const createIngredient = async (name, purveyorId) => {
  const response = await api.post('/ingredients', { name, purveyor: purveyorId });
  return response.data;
};

export const updateIngredient = async (id, name, purveyorId) => {
  const response = await api.put(`/ingredients/${id}`, { name, purveyor: purveyorId });
  return response.data;
};

export const deleteIngredient = async (id) => {
  const response = await api.delete(`/ingredients/${id}`);
  return response.data;
};

export const checkIngredientUsage = async (id) => {
  const response = await api.get(`/recipes?ingredient=${id}&active=true`);
  return response.data.length > 0;
};

export const getRecipeById = async (id) => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (data) => {
  const response = await api.post('/recipes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateRecipe = async (id, data) => {
  const response = await api.put(`/recipes/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteRecipe = async (id) => {
  const response = await api.delete(`/recipes/${id}`);
  return response.data;
};

export const getConfig = async () => {
  const response = await axios.get(`${apiUrl}/config`); // Keep public
  return response.data;
};

export const updateConfig = async (config) => {
  const response = await api.put('/config', config);
  return response.data;
};

export const uploadLogo = async (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await api.post('/config/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getPdfTemplate = async () => {
  try {
    const response = await api.get('/templates/default');
    return response.data.template.fields;
  } catch (err) {
    console.error('Error fetching PDF template:', err);
    throw err;
  }
};

// Change Log API functions
export const getChangeLogs = async (params = {}) => {
  try {
    const response = await api.get('/api/changelog', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching change logs:', err);
    throw err;
  }
};

export const getUserChangeLogs = async (userId, params = {}) => {
  try {
    const response = await api.get(`/api/changelog/user/${userId}`, { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching user change logs:', err);
    throw err;
  }
};

export const getRecipeChangeLogs = async (recipeId, params = {}) => {
  try {
    const response = await api.get(`/api/changelog/recipe/${recipeId}`, { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching recipe change logs:', err);
    throw err;
  }
};

export const getMyChangeLogs = async (params = {}) => {
  try {
    const response = await api.get('/api/changelog/my-logs', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching my change logs:', err);
    throw err;
  }
};

export const getChangeLogStats = async (params = {}) => {
  try {
    const response = await api.get('/api/changelog/stats', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching change log stats:', err);
    throw err;
  }
};

export const cleanupChangeLogs = async () => {
  try {
    const response = await api.delete('/api/changelog/cleanup');
    return response.data;
  } catch (err) {
    console.error('Error cleaning up change logs:', err);
    throw err;
  }
};

export const exportChangeLogs = async (params = {}) => {
  try {
    const response = await api.get('/api/changelog/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (err) {
    console.error('Error exporting change logs:', err);
    throw err;
  }
};

// User Management API functions
export const getUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return response.data;
  } catch (err) {
    console.error('Error fetching users:', err);
    throw err;
  }
};

export const getUserReport = async () => {
  try {
    const response = await api.get('/api/users/report');
    return response.data;
  } catch (err) {
    console.error('Error fetching user report:', err);
    throw err;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/api/users', userData);
    return response.data;
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  } catch (err) {
    console.error('Error deleting user:', err);
    throw err;
  }
};

export const getMyProfile = async () => {
  try {
    const response = await api.get('/api/users/my-profile');
    return response.data;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    throw err;
  }
};

export const updateMyProfile = async (profileData) => {
  try {
    const response = await api.put('/api/users/my-profile', profileData);
    return response.data;
  } catch (err) {
    console.error('Error updating user profile:', err);
    throw err;
  }
};

// Bulk Upload API functions
export const getBulkUploadTemplate = async () => {
  try {
    const response = await api.get('/api/bulk-upload/template');
    return response.data;
  } catch (err) {
    console.error('Error fetching bulk upload template:', err);
    throw err;
  }
};

export const uploadRecipesFromFile = async (file, skipDuplicates = false) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skipDuplicates', skipDuplicates.toString());

    const response = await api.post('/api/bulk-upload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    console.error('Error uploading recipes from file:', err);
    throw err;
  }
};

export const uploadRecipesFromGoogleSheets = async (sheetId, credentials, skipDuplicates = false) => {
  try {
    const response = await api.post('/api/bulk-upload/google-sheets', {
      sheetId,
      credentials,
      skipDuplicates
    });
    return response.data;
  } catch (err) {
    console.error('Error uploading recipes from Google Sheets:', err);
    throw err;
  }
};

export const previewRecipesFromFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/bulk-upload/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    console.error('Error previewing recipes from file:', err);
    throw err;
  }
};

export const getSupportedFormats = async () => {
  try {
    const response = await api.get('/api/bulk-upload/supported-formats');
    return response.data;
  } catch (err) {
    console.error('Error fetching supported formats:', err);
    throw err;
  }
};