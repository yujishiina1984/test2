/**
 * Weather Forecast Application
 * Fetches and displays weather data from OpenWeatherMap API
 */

// API Configuration
// Replace with your OpenWeatherMap API key
const API_KEY = 'YOUR_API_KEY_HERE';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

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
    
    // Check if API key is configured
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please configure your OpenWeatherMap API key in script.js');
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
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please configure your OpenWeatherMap API key in script.js');
        return;
    }
    
    await fetchWeatherData(city);
}

/**
 * Fetch weather data from OpenWeatherMap API
 * @param {string} city - City name to search for
 */
async function fetchWeatherData(city) {
    showLoading();
    hideError();
    hideWeatherCard();
    
    try {
        const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(getErrorMessage(response.status, errorData));
        }
        
        const data = await response.json();
        displayWeatherData(data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Get user-friendly error message based on status code
 * @param {number} status - HTTP status code
 * @param {Object} errorData - Error response data
 * @returns {string} User-friendly error message
 */
function getErrorMessage(status, errorData) {
    switch (status) {
        case 401:
            return 'Invalid API key. Please check your OpenWeatherMap API key.';
        case 404:
            return 'City not found. Please check the city name and try again.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
            return 'Weather service is temporarily unavailable. Please try again later.';
        default:
            return errorData.message || 'An error occurred while fetching weather data.';
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
