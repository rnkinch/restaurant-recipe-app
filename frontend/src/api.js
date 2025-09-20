import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';

export const getRecipes = async (all = true) => {
  const query = all ? '' : '?active=true';
  const response = await axios.get(`${apiUrl}/recipes${query}`);
  return response.data;
};

export const getPurveyors = async () => {
  const response = await axios.get(`${apiUrl}/purveyors`);
  return response.data;
};

export const createPurveyor = async (purveyor) => {
  const response = await axios.post(`${apiUrl}/purveyors`, purveyor);
  return response.data;
};

export const updatePurveyor = async (id, name) => {
  const response = await axios.put(`${apiUrl}/purveyors/${id}`, { name });
  return response.data;
};

export const deletePurveyor = async (id) => {
  const response = await axios.delete(`${apiUrl}/purveyors/${id}`);
  return response.data;
};

export const getIngredients = async () => {
  const response = await axios.get(`${apiUrl}/ingredients`);
  return response.data;
};

export const createIngredient = async (name, purveyorId) => {
  const response = await axios.post(`${apiUrl}/ingredients`, { name, purveyor: purveyorId });
  return response.data;
};

export const updateIngredient = async (id, name, purveyorId) => {
  const response = await axios.put(`${apiUrl}/ingredients/${id}`, { name, purveyor: purveyorId });
  return response.data;
};

export const deleteIngredient = async (id) => {
  const response = await axios.delete(`${apiUrl}/ingredients/${id}`);
  return response.data;
};

export const checkIngredientUsage = async (id) => {
  const response = await axios.get(`${apiUrl}/recipes?ingredient=${id}&active=true`);
  return response.data.length > 0;
};

export const getRecipeById = async (id) => {
  const response = await axios.get(`${apiUrl}/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (data) => {
  const response = await axios.post(`${apiUrl}/recipes`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateRecipe = async (id, data) => {
  const response = await axios.put(`${apiUrl}/recipes/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteRecipe = async (id) => {
  const response = await axios.delete(`${apiUrl}/recipes/${id}`);
  return response.data;
};