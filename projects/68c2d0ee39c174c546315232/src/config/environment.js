// Environment configuration

const config = {
  development: {
    apiBaseUrl: 'http://localhost:3001/api',
    enableLogging: true,
    debugMode: true,
  },
  production: {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || '/api',
    enableLogging: false,
    debugMode: false,
  },
  test: {
    apiBaseUrl: 'http://localhost:3001/api',
    enableLogging: false,
    debugMode: false,
  }
};

const environment = process.env.NODE_ENV || 'development';

export default {
  ...config[environment],
  environment,
  isProduction: environment === 'production',
  isDevelopment: environment === 'development',
  isTest: environment === 'test',
};