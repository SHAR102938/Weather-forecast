const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather');
const getLocationBtn = document.getElementById('get-location');
const unitSelect = document.getElementById('unit-select');
const weatherDisplay = document.getElementById('weather-display');
const weatherIcon = document.getElementById('weather-icon');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const sunriseSunset = document.getElementById('sunrise-sunset');
const airQuality = document.getElementById('air-quality');
const alertsContainer = document.getElementById('alerts');
const forecastContainer = document.getElementById('forecast-container');
const background = document.getElementById('background');

let currentUnit = 'metric';

getWeatherBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city, currentUnit);
    } else {
        showError('Please enter a city name.');
    }
});

getLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            // Check if coordinates are valid numbers
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
                fetchWeatherByCoords(lat, lon, currentUnit);
            } else {
                showError('Invalid location coordinates received.');
            }
        }, (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    showError('Permission denied for location access.');
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError('Location information is unavailable.');
                    break;
                case error.TIMEOUT:
                    showError('Location request timed out.');
                    break;
                default:
                    showError('Unable to retrieve your location.');
            }
        });
    } else {
        showError('Geolocation is not supported by your browser.');
    }
});

unitSelect.addEventListener('change', () => {
    currentUnit = unitSelect.value;
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city, currentUnit);
    }
});

async function fetchWeather(city, unit) {
    try {
        // Geocode city to get lat/lon
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        if (!geoResponse.ok) throw new Error('Geocoding failed');
        const geoData = await geoResponse.json();
        if (geoData.length === 0) throw new Error('City not found');
        const { lat, lon, display_name } = geoData[0];
        await fetchWeatherByCoords(lat, lon, unit, display_name);
        hideError();
    } catch (error) {
        showError(error.message);
        hideWeather();
    }
}

async function fetchWeatherByCoords(lat, lon, unit, cityDisplayName = '') {
    try {
        // Fetch weather data from Open-Meteo API (free, no API key required)
        const tempUnit = unit === 'imperial' ? 'fahrenheit' : 'celsius';
        const windUnit = unit === 'imperial' ? 'mph' : 'kmh';
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
        if (!weatherResponse.ok) throw new Error('Weather data fetch failed');
        const weatherData = await weatherResponse.json();

        // Fetch air quality data
        const airQualityResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`);
        let airQualityData = null;
        if (airQualityResponse.ok) {
            airQualityData = await airQualityResponse.json();
        }

        displayWeather(weatherData, airQualityData, cityDisplayName, unit);
        hideError();
    } catch (error) {
        showError(error.message);
        hideWeather();
    }
}

function displayWeather(data, airQualityData, cityDisplayName, unit) {
    const current = data.current_weather;
    const daily = data.daily;
    const hourly = data.hourly;

    // Weather icon and description based on weathercode
    const weatherCode = current.weathercode;
    let iconUrl = '';
    let descriptionText = '';
    let condition = '';
    switch (weatherCode) {
        case 0:
            iconUrl = 'https://openweathermap.org/img/wn/01d@2x.png';
            descriptionText = 'Clear sky';
            condition = 'clear';
            break;
        case 1:
        case 2:
            iconUrl = 'https://openweathermap.org/img/wn/02d@2x.png';
            descriptionText = 'Partly cloudy';
            condition = 'clouds';
            break;
        case 3:
            iconUrl = 'https://openweathermap.org/img/wn/04d@2x.png';
            descriptionText = 'Overcast';
            condition = 'clouds';
            break;
        case 45:
        case 48:
            iconUrl = 'https://openweathermap.org/img/wn/50d@2x.png';
            descriptionText = 'Fog';
            condition = 'fog';
            break;
        case 51:
        case 53:
        case 55:
            iconUrl = 'https://openweathermap.org/img/wn/09d@2x.png';
            descriptionText = 'Drizzle';
            condition = 'rain';
            break;
        case 56:
        case 57:
            iconUrl = 'https://openweathermap.org/img/wn/09d@2x.png';
            descriptionText = 'Freezing drizzle';
            condition = 'rain';
            break;
        case 61:
        case 63:
        case 65:
            iconUrl = 'https://openweathermap.org/img/wn/10d@2x.png';
            descriptionText = 'Rain';
            condition = 'rain';
            break;
        case 66:
        case 67:
            iconUrl = 'https://openweathermap.org/img/wn/10d@2x.png';
            descriptionText = 'Freezing rain';
            condition = 'rain';
            break;
        case 71:
        case 73:
        case 75:
            iconUrl = 'https://openweathermap.org/img/wn/13d@2x.png';
            descriptionText = 'Snow';
            condition = 'snow';
            break;
        case 77:
            iconUrl = 'https://openweathermap.org/img/wn/13d@2x.png';
            descriptionText = 'Snow grains';
            condition = 'snow';
            break;
        case 80:
        case 81:
        case 82:
            iconUrl = 'https://openweathermap.org/img/wn/09d@2x.png';
            descriptionText = 'Rain showers';
            condition = 'rain';
            break;
        case 85:
        case 86:
            iconUrl = 'https://openweathermap.org/img/wn/13d@2x.png';
            descriptionText = 'Snow showers';
            condition = 'snow';
            break;
        case 95:
            iconUrl = 'https://openweathermap.org/img/wn/11d@2x.png';
            descriptionText = 'Thunderstorm';
            condition = 'thunderstorm';
            break;
        case 96:
        case 99:
            iconUrl = 'https://openweathermap.org/img/wn/11d@2x.png';
            descriptionText = 'Thunderstorm with hail';
            condition = 'thunderstorm';
            break;
        default:
            iconUrl = 'https://openweathermap.org/img/wn/01d@2x.png';
            descriptionText = 'Unknown';
            condition = 'clear';
            break;
    }

    // Temperature with unit symbol
    const tempUnit = unit === 'imperial' ? '°F' : '°C';
    const speedUnit = unit === 'imperial' ? 'mph' : 'km/h';

    // Sunrise and sunset times (from daily[0])
    const sunriseTime = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Humidity and wind speed from hourly (current hour)
    const currentHourIndex = new Date().getHours();
    const humidityValue = hourly.relative_humidity_2m[currentHourIndex];
    const windSpeedValue = hourly.windspeed_10m[currentHourIndex];

    // Air quality
    let airQualityText = 'Air Quality: N/A';
    if (airQualityData && airQualityData.current && airQualityData.current.european_aqi !== undefined) {
        const aqi = airQualityData.current.european_aqi;
        airQualityText = `Air Quality Index: ${aqi}`;
    }

    // Weather alerts (Open-Meteo doesn't provide alerts, so hide)
    alertsContainer.style.display = 'none';
    alertsContainer.innerHTML = '';

    // Update UI elements
    weatherIcon.src = iconUrl;
    cityName.textContent = cityDisplayName || cityInput.value;
    temperature.textContent = `Temperature: ${current.temperature}${tempUnit}`;
    description.textContent = `Weather: ${descriptionText}`;
    humidity.textContent = `Humidity: ${humidityValue}%`;
    windSpeed.textContent = `Wind Speed: ${windSpeedValue} ${speedUnit}`;
    sunriseSunset.textContent = `Sunrise: ${sunriseTime} | Sunset: ${sunsetTime}`;
    airQuality.textContent = airQualityText;

    // Update background based on weather condition
    updateBackground(condition);

    // Display 3-day forecast
    displayForecast(daily, tempUnit);

    weatherDisplay.style.display = 'block';
}

function displayForecast(daily, tempUnit) {
    forecastContainer.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
        const weatherCode = daily.weathercode[i];
        let iconUrl = '';
        let description = '';
        switch (weatherCode) {
            case 0:
                iconUrl = 'https://openweathermap.org/img/wn/01d@2x.png';
                description = 'Clear sky';
                break;
            case 1:
            case 2:
                iconUrl = 'https://openweathermap.org/img/wn/02d@2x.png';
                description = 'Partly cloudy';
                break;
            case 3:
                iconUrl = 'https://openweathermap.org/img/wn/04d@2x.png';
                description = 'Overcast';
                break;
            case 45:
            case 48:
                iconUrl = 'https://openweathermap.org/img/wn/50d@2x.png';
                description = 'Fog';
                break;
            case 51:
            case 53:
            case 55:
                iconUrl = 'https://openweathermap.org/img/wn/09d@2x.png';
                description = 'Drizzle';
                break;
            case 56:
            case 57:
                iconUrl = 'https://openweathermap.org/img/wn/09d@2x.png';
                description = 'Freezing drizzle';
                break;
            case 61:
            case 63:
            case 65:
                iconUrl = 'https://openweathermap.org/img/wn/10d@2x.png';
                description = 'Rain';
                break;
            case 66:
            case 67:
                iconUrl = 'https://openweathermap.org/img/wn/10d@2x.png';
                description = 'Freezing rain';
                break;
            case 71:
            case 73:
            case 75:
                iconUrl = 'https://openweathermap.org/img/wn/13d@2x.png';
                description = 'Snow';
                break;
            case 77:
                iconUrl = 'https://openweathermap.org/img/wn/13d@2x.png';
                description = 'Snow grains';
                break;
            case 80:
            case 81:
            case 82:
                iconUrl = 'https://openweathermap.org/img/wn/09d@2x.png';
                description = 'Rain showers';
                break;
            case 85:
            case 86:
                iconUrl = 'https://openweathermap.org/img/wn/13d@2x.png';
                description = 'Snow showers';
                break;
            case 95:
                iconUrl = 'https://openweathermap.org/img/wn/11d@2x.png';
                description = 'Thunderstorm';
                break;
            case 96:
            case 99:
                iconUrl = 'https://openweathermap.org/img/wn/11d@2x.png';
                description = 'Thunderstorm with hail';
                break;
            default:
                iconUrl = 'https://openweathermap.org/img/wn/01d@2x.png';
                description = 'Unknown';
                break;
        }
        const tempMax = daily.temperature_2m_max[i];
        const tempMin = daily.temperature_2m_min[i];

        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <p>${dayName}</p>
            <img src="${iconUrl}" alt="${description}">
            <p>${description}</p>
            <p>Max: ${tempMax}${tempUnit}</p>
            <p>Min: ${tempMin}${tempUnit}</p>
        `;
        forecastContainer.appendChild(forecastDay);
    }
}

function updateBackground(condition) {
    let bgUrl = '';
    switch (condition) {
        case 'clear':
            bgUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1350&q=80';
            break;
        case 'clouds':
            bgUrl = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1350&q=80';
            break;
        case 'rain':
        case 'drizzle':
            bgUrl = 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1350&q=80';
            break;
        case 'thunderstorm':
            bgUrl = 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1350&q=80';
            break;
        case 'snow':
            bgUrl = 'https://images.unsplash.com/photo-1602524812923-0a7a3a1a7a1a?auto=format&fit=crop&w=1350&q=80';
            break;
        case 'mist':
        case 'fog':
            bgUrl = 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1350&q=80';
            break;
        default:
            bgUrl = 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=1350&q=80';
            break;
    }
    background.style.backgroundImage = `url('${bgUrl}')`;
}

function hideWeather() {
    weatherDisplay.style.display = 'none';
    alertsContainer.style.display = 'none';
    forecastContainer.innerHTML = '';
}

function showError(message) {
    errorMessage.textContent = message;
}

function hideError() {
    errorMessage.textContent = '';
}

// Auto-update every 10 minutes for real-time feel
setInterval(() => {
    const city = cityInput.value.trim();
    if (city && weatherDisplay.style.display === 'block') {
        fetchWeather(city, currentUnit);
    }
}, 600000); // 10 minutes