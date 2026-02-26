import axios from 'axios';

// Create an axios instance
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Adjust if your backend port is different
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the x-auth-token in the headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const locale = localStorage.getItem('locale') === 'mm' ? 'mm' : 'en';
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        config.headers['x-lang'] = locale;
        config.headers['accept-language'] = locale === 'mm' ? 'my-MM,my;q=0.9,en;q=0.7' : 'en-US,en;q=0.9';
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized access (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('auth');
            localStorage.removeItem('role');
            localStorage.removeItem('userName');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
