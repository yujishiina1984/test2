# Weather Forecast Web Application

A simple, clean, and responsive weather forecast application that runs directly in your browser. Get current weather conditions for any city worldwide.

## Features

- 🔍 Search weather by city name
- 🌡️ Display current temperature in Celsius
- ☁️ Weather description with visual icon
- 💧 Humidity percentage
- 💨 Wind speed in m/s
- 🌡️ "Feels like" temperature
- 👁️ Visibility in kilometers
- 📱 Responsive design for all screen sizes
- 🌙 Dark mode support (follows system preference)
- ⚠️ User-friendly error handling

## Prerequisites

- A modern web browser (Safari, Chrome, Firefox, Edge)
- An OpenWeatherMap API key (free tier available)

## Setup Instructions

### Step 1: Get an API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/)
2. Click on "Sign In" or "Sign Up" to create a free account
3. After signing in, go to your profile and navigate to "API keys"
4. Generate a new API key (or use the default one provided)
5. Note: New API keys may take a few hours to become active

### Step 2: Configure the Application

1. Open the `script.js` file in a text editor
2. Find the line near the top:
   ```javascript
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```
3. Replace `YOUR_API_KEY_HERE` with your actual API key:
   ```javascript
   const API_KEY = 'your_actual_api_key_here';
   ```
4. Save the file

### Step 3: Run the Application

**Option 1: Direct File Opening**
- Simply double-click on `index.html` to open it in your default browser
- Or right-click `index.html` and select "Open With" → your preferred browser

**Option 2: Using a Local Server (Recommended for development)**

If you have Python installed:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

If you have Node.js installed:
```bash
# Using npx (no installation required)
npx serve

# Or install serve globally
npm install -g serve
serve
```

## Usage Guide

1. **Search for a City**
   - Enter a city name in the search box (e.g., "Tokyo", "New York", "London")
   - Press Enter or click the "Search" button

2. **View Weather Information**
   - The current weather conditions will be displayed including:
     - City name and country
     - Current date and time
     - Weather icon and description
     - Temperature
     - Humidity, wind speed, feels like temperature, and visibility

3. **Error Handling**
   - If a city is not found, an error message will be displayed
   - If the API key is invalid, you'll be prompted to check your configuration
   - Network errors are handled gracefully with user-friendly messages

## File Structure

```
test2/
├── index.html      # Main HTML file with the application structure
├── styles.css      # CSS styles for the user interface
├── script.js       # JavaScript logic for fetching and displaying weather data
└── README.md       # This documentation file
```

## Browser Compatibility

The application is tested and works on:
- Safari (macOS)
- Google Chrome
- Mozilla Firefox
- Microsoft Edge

## API Information

This application uses the [OpenWeatherMap Current Weather Data API](https://openweathermap.org/current).

**Free Tier Limits:**
- 60 calls per minute
- 1,000,000 calls per month

## Troubleshooting

### "Invalid API key" error
- Make sure you've replaced `YOUR_API_KEY_HERE` with your actual API key
- New API keys may take up to 2 hours to activate
- Verify your API key is correct in your OpenWeatherMap account

### "City not found" error
- Check the spelling of the city name
- Try using the format "City, Country Code" (e.g., "Paris, FR")
- Some smaller cities might not be in the database

### Weather icon not loading
- Check your internet connection
- The icons are loaded from OpenWeatherMap's servers

### Application not loading
- Make sure all files (index.html, styles.css, script.js) are in the same directory
- Try opening the browser's developer console (F12) to check for errors

## License

This project is open source and available for personal and educational use.

## Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Weather icons provided by OpenWeatherMap
