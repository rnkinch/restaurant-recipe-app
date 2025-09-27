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

export const register = async (username, password, role = 'user') => {
  const response = await axios.post(`${apiUrl}/auth/register`, { username, password, role });
  return response.data;
};

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