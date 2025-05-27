import axios from 'axios';
import config from '../config';

export interface Language {
  id: number;
  name: string;
}

export const languageService = {  getLanguages: async (): Promise<Language[]> => {
    const response = await axios.get(`${config.BASE_API_URL}/Language`);
    return response.data;
  },

  createLanguage: async (name: string): Promise<Language> => {
    const response = await axios.post(`${config.BASE_API_URL}/Language`, { name });
    return response.data;
  },

  updateLanguage: async (id: number, name: string): Promise<Language> => {
    const response = await axios.put(`${config.BASE_API_URL}/Language/${id}`, { id, name });
    return response.data;
  },

  deleteLanguage: async (id: number): Promise<void> => {
    await axios.delete(`${config.BASE_API_URL}/Language/${id}`);
  }
};
