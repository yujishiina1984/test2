/**
 * AWS Lambda function for Weather API
 * Handles requests from API Gateway and fetches weather data from OpenWeatherMap
 */

const https = require('https');

// OpenWeatherMap API configuration
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const OPENWEATHERMAP_BASE_URL = 'api.openweathermap.org';

/**
 * Make HTTPS request to OpenWeatherMap API
 * @param {string} city - City name to search for
 * @returns {Promise<Object>} Weather data from API
 */
function fetchWeatherData(city) {
    return new Promise((resolve, reject) => {
        const path = `/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        
        const options = {
            hostname: OPENWEATHERMAP_BASE_URL,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    reject(new Error('Failed to parse response from weather API'));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Create response with CORS headers
 * @param {number} statusCode - HTTP status code
 * @param {Object} body - Response body
 * @returns {Object} API Gateway response object
 */
function createResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        body: JSON.stringify(body)
    };
}

/**
 * Lambda handler function
 * @param {Object} event - API Gateway event
 * @param {Object} context - Lambda context
 * @returns {Object} API Gateway response
 */
exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return createResponse(200, { message: 'OK' });
    }

    // Validate API key configuration
    if (!OPENWEATHERMAP_API_KEY) {
        console.error('OPENWEATHERMAP_API_KEY environment variable is not set');
        return createResponse(500, {
            error: 'Internal server error',
            message: 'Weather service is not configured properly'
        });
    }

    // Get city from query parameters
    const city = event.queryStringParameters?.city;

    if (!city) {
        return createResponse(400, {
            error: 'Bad request',
            message: 'City parameter is required'
        });
    }

    // Validate city parameter
    if (city.length > 100) {
        return createResponse(400, {
            error: 'Bad request',
            message: 'City name is too long'
        });
    }

    try {
        const result = await fetchWeatherData(city);

        if (result.statusCode === 200) {
            return createResponse(200, result.data);
        } else if (result.statusCode === 404) {
            return createResponse(404, {
                error: 'Not found',
                message: 'City not found. Please check the city name and try again.'
            });
        } else if (result.statusCode === 401) {
            console.error('Invalid OpenWeatherMap API key');
            return createResponse(500, {
                error: 'Internal server error',
                message: 'Weather service authentication failed'
            });
        } else if (result.statusCode === 429) {
            return createResponse(429, {
                error: 'Too many requests',
                message: 'Weather service rate limit exceeded. Please try again later.'
            });
        } else {
            console.error('Unexpected response from weather API:', result);
            return createResponse(502, {
                error: 'Bad gateway',
                message: 'Weather service returned an unexpected response'
            });
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return createResponse(503, {
            error: 'Service unavailable',
            message: 'Unable to fetch weather data. Please try again later.'
        });
    }
};
