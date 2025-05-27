const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
    BASE_API_URL: isDevelopment ? 'http://localhost:5195/api' : '/api'
};

export default config;
