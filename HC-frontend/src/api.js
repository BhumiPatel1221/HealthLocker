import axios from 'axios';

// Use VITE_API_BASE_URL if set, otherwise auto-detect dev/prod
const getBaseURL = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // Vite sets import.meta.env.DEV to true during `npm run dev`
    if (import.meta.env.DEV) {
        return 'http://localhost:5000/api';
    }
    return 'https://healthlocker-backend.onrender.com/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Handle unauthorized/forbidden
            // Maybe redirect to login if not on login page
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── Share Link API helpers ───────────────────────────────────────────────────

/**
 * Create a shareable link.
 * @param {{ fileId?: string, folderId?: string, recordId?: string, expiresAt: string, password?: string }} opts
 */
export const createShareLink = (opts) => api.post('/share', opts);

/**
 * Access a shared resource by token (public — no auth required).
 * @param {string} token
 * @param {string} [password]
 */
export const accessShareLink = (token, password) =>
    api.get(`/share/access/${token}`, { params: password ? { password } : {} });

/** Revoke a share link by token. */
export const revokeShareLink = (token) => api.delete(`/share/${token}`);

/** List all share links created by the current user. */
export const listShareLinks = () => api.get('/share');

