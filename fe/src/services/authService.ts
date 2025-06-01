import { apiClient } from './apiService';

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
        const response = await apiClient.post<AuthResponse>('/AppUser/login', credentials);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/AppUser/register', data);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    getUser(): UserDto | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    async logout(): Promise<void> {
        try {
            await apiClient.post('/AppUser/logout');
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