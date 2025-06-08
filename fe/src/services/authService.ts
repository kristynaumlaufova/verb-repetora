import { apiClient } from './apiService';

/**
 * Interface for user login request
 * @param username The username for login
 * @param password The password for login
 */
export interface LoginRequest {
    username: string;
    password: string;
}

/**
 * Interface for user registration request
 * @param username The username for registration
 * @param password The password for registration
 * @param language The initial language for the user
 */
export interface RegisterRequest {
    username: string;
    password: string;
    language: string;
}

/**
 * Data transfer object for user information
 * @param id The unique identifier for the user
 * @param username The username of the user
 * @param languages The languages associated with the user
 */
export interface UserDto {
    id: number;
    username: string;
    languages: Array<{
        id: number;
        name: string;
    }>;
}

/**
 * Response structure for authentication operations
 * @param message The status message of the operation
 * @param user The user data returned after authentication
 */
export interface AuthResponse {
    message: string;
    user: UserDto;
}

/**
 * Service for handling authentication operations
 */
export const authService = {      
    /**
     * Logs in a user with the provided credentials
     * @param credentials The login credentials
     * @returns A promise that resolves to the authentication response
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/AppUser/login', credentials);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },    
    
    /**
     * Registers a new user with the provided information
     * @param data The registration data
     * @returns A promise that resolves to the authentication response
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/AppUser/register', data);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },    
    
    /**
     * Retrieves the current user from local storage
     * @returns The current user or null if not logged in
     */
    getUser(): UserDto | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },    
    
    /**
     * Logs out the current user
     * @returns A promise that resolves when logout is complete
     * @throws Will throw an error if the logout request fails
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('/AppUser/logout');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth-change'));
        } catch (error) {
            throw error;
        }
    }
};