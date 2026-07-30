// Detect the current host and use appropriate API URL
export const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5011';
    } else {
        // When accessed from other devices, use the current host
        return `http://${hostname}:5011`;
    }
};

export const API_BASE_URL = getApiBaseUrl();