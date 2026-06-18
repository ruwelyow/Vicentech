import { api } from './axios';

export const checkAuth = async () => {
    try {
        const response = await api.get('/me');
        // Optionally update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        // If auth fails, remove user from localStorage
        localStorage.removeItem('user');
        console.error('Auth check failed:', error);
        return null;
    }
};

export const isAuthenticated = () => {
    const user = localStorage.getItem('user');
    return user !== null;
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}; 