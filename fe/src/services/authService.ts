import axios from 'axios';
import config from '../config';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth-change'));
        }
        return Promise.reject(error);
    }
);

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    language: string;
}

export interface UserDto {
    id: number;
    username: string;
    languages: Array<{
        id: number;
        name: string;
    }>;
}

export interface AuthResponse {
    message: string;
    user: UserDto;
}

export const authService = {    
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(`${config.BASE_API_URL}/AppUser/login`, credentials);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(`${config.BASE_API_URL}/AppUser/register`, data);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    getUser(): UserDto | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },    async logout(): Promise<void> {
        try {
            await axios.post(`${config.BASE_API_URL}/AppUser/logout`);
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth-change'));
        } catch (error) {
            throw error;
        }
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('user');
    }
};