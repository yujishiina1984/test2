/**
 * Weather Forecast Application (AWS Version)
 * Fetches weather data through AWS API Gateway + Lambda
 */

// API Configuration
// Replace with your actual API Gateway URL after deployment
// Example: 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/production/weather'
const API_GATEWAY_URL = 'YOUR_API_GATEWAY_URL_HERE';

// DOM Elements
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
const errorMessage = document.getElementById('error-message');
const loadingElement = document.getElementById('loading');

// Weather data display elements
const cityNameEl = document.getElementById('city-name');
const weatherDateEl = document.getElementById('weather-date');
const weatherIconEl = document.getElementById('weather-icon');
const weatherDescriptionEl = document.getElementById('weather-description');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const visibilityEl = document.getElementById('visibility');

/**
 * Initialize the application
 */
function init() {
    searchForm.addEventListener('submit', handleSearch);
    cityInput.addEventListener('input', clearError);
    
    // Check if API Gateway URL is configured
    if (API_GATEWAY_URL === 'YOUR_API_GATEWAY_URL_HERE') {
        showError('Please configure your API Gateway URL in script.js');
    }
}

/**
 * Handle search form submission
 * @param {Event} event - Form submit event
 */
async function handleSearch(event) {
    event.preventDefault();
    
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    if (API_GATEWAY_URL === 'YOUR_API_GATEWAY_URL_HERE') {
        showError('Please configure your API Gateway URL in script.js');
        return;
    }
    
    await fetchWeatherData(city);
}

/**
 * Fetch weather data from API Gateway
 * @param {string} city - City name to search for
 */
async function fetchWeatherData(city) {
    showLoading();
    hideError();
    hideWeatherCard();
    
    try {
        const url = `${API_GATEWAY_URL}?city=${encodeURIComponent(city)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || getErrorMessage(response.status));
        }
        
        displayWeatherData(data);
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            showError('Unable to connect to the weather service. Please check your internet connection.');
        } else {
            showError(error.message);
        }
    } finally {
        hideLoading();
    }
}

/**
 * Get user-friendly error message based on status code
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly error message
 */
function getErrorMessage(status) {
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
        case 403:
            return 'Authorization error. Please contact support.';
        case 404:
            return 'City not found. Please check the city name and try again.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
            return 'Weather service is temporarily unavailable. Please try again later.';
        default:
            return 'An error occurred while fetching weather data.';
    }
}

/**
 * Display weather data in the UI
 * @param {Object} data - Weather data from API
 */
function displayWeatherData(data) {
    // City name and country
    const countryName = getCountryName(data.sys.country);
    cityNameEl.textContent = `${data.name}, ${countryName}`;
    
    // Current date and time
    const date = new Date();
    weatherDateEl.textContent = formatDate(date);
    
    // Weather icon and description
    const iconCode = data.weather[0].icon;
    weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIconEl.alt = data.weather[0].description;
    weatherDescriptionEl.textContent = data.weather[0].description;
    
    // Temperature
    temperatureEl.textContent = Math.round(data.main.temp);
    
    // Weather details
    humidityEl.textContent = `${data.main.humidity}%`;
    windSpeedEl.textContent = `${data.wind.speed} m/s`;
    feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°C`;
    
    // Visibility (convert from meters to kilometers)
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    visibilityEl.textContent = `${visibilityKm} km`;
    
    showWeatherCard();
}

/**
 * Get country name from country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} Country name or code if not found
 */
function getCountryName(countryCode) {
    try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        return regionNames.of(countryCode) || countryCode;
    } catch (error) {
        return countryCode;
    }
}

/**
 * Format date for display
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Clear error when user starts typing
 */
function clearError() {
    if (!errorMessage.classList.contains('hidden')) {
        hideError();
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    loadingElement.classList.remove('hidden');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    loadingElement.classList.add('hidden');
}

/**
 * Show weather card
 */
function showWeatherCard() {
    weatherCard.classList.remove('hidden');
}

/**
 * Hide weather card
 */
function hideWeatherCard() {
    weatherCard.classList.add('hidden');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
