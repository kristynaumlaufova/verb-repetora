import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface Language {
  id: number;
  name: string;
}

export const languageService = {
  getLanguages: async (): Promise<Language[]> => {
    const response = await axios.get(`${API_URL}/Language`);
    return response.data;
  },

  createLanguage: async (name: string): Promise<Language> => {
    const response = await axios.post(`${API_URL}/Language`, { name });
    return response.data;
  },

  updateLanguage: async (id: number, name: string): Promise<Language> => {
    const response = await axios.put(`${API_URL}/Language/${id}`, { id, name });
    return response.data;
  },

  deleteLanguage: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/Language/${id}`);
  }
};
