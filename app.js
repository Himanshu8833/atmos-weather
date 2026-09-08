// Open-Meteo & Open-Source Weather Telemetry Config
const WORLD_CITIES = [
    { name: "London", country: "UK", lat: 51.5074, lon: -0.1278 },
    { name: "New York", country: "US", lat: 40.7128, lon: -74.0060 },
    { name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503 },
    { name: "Dubai", country: "AE", lat: 25.2048, lon: 55.2708 },
    { name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522 },
    { name: "Sydney", country: "AU", lat: -33.8688, lon: 151.2093 },
    { name: "Singapore", country: "SG", lat: 1.3521, lon: 103.8198 },
    { name: "Cairo", country: "EG", lat: 30.0444, lon: 31.2357 }
];

let isCelsius = true;
let currentWeatherData = null;
let currentCityName = "Delhi";

// WMO Weather Code Mapper
function decodeWMO(code) {
    const map = {
        0: { desc: "Clear Sky", icon: "01d", group: "clear" },
        1: { desc: "Mainly Clear", icon: "02d", group: "clear" },
        2: { desc: "Partly Cloudy", icon: "03d", group: "clouds" },
        3: { desc: "Overcast", icon: "04d", group: "clouds" },
        45: { desc: "Fog", icon: "50d", group: "clouds" },
        48: { desc: "Depositing Rime Fog", icon: "50d", group: "clouds" },
        51: { desc: "Light Drizzle", icon: "09d", group: "rain" },
        53: { desc: "Moderate Drizzle", icon: "09d", group: "rain" },
        55: { desc: "Dense Drizzle", icon: "09d", group: "rain" },
        61: { desc: "Slight Rain", icon: "10d", group: "rain" },
        63: { desc: "Moderate Rain", icon: "10d", group: "rain" },
        65: { desc: "Heavy Rain", icon: "10d", group: "rain" },
        71: { desc: "Slight Snow", icon: "13d", group: "snow" },
        73: { desc: "Moderate Snow", icon: "13d", group: "snow" },
        75: { desc: "Heavy Snow", icon: "13d", group: "snow" },
        80: { desc: "Rain Showers", icon: "09d", group: "rain" },
        95: { desc: "Thunderstorm", icon: "11d", group: "thunder" }
    };
    return map[code] || { desc: "Partly Cloudy", icon: "03d", group: "clouds" };
}

function formatTemp(celsius) {
    if (!isCelsius) {
        return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
}

// Live Clock Initializer
function startClock() {
    function update() {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
        const timeStr = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        document.getElementById("live-clock").innerHTML = `
            <span class="clock-date">${dateStr}</span>
            <span class="clock-dot">•</span>
            <span class="clock-time">${timeStr}</span>
        `;
    }
    update();
    setInterval(update, 1000);
}

// Fetch World Major Cities Live Temperatures
async function loadWorldCitiesWeather() {
    const container = document.getElementById("world-cities-container");
    container.innerHTML = "";

    for (const city of WORLD_CITIES) {
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code`
            );
            const data = await res.json();
            const temp = formatTemp(data.current.temperature_2m);
            const weather = decodeWMO(data.current.weather_code);

            const card = document.createElement("div");
            card.className = "world-card";
            card.innerHTML = `
                <div class="world-city-name">${city.name}</div>
                <div class="world-country-code">${city.country}</div>
                <img src="https://openweathermap.org/img/wn/${weather.icon}.png" alt="${weather.desc}" />
                <div class="world-temp">${temp}°${isCelsius ? "C" : "F"}</div>
                <div class="world-condition">${weather.desc}</div>
            `;

            // Click to load city weather in main dashboard
            card.onclick = () => {
                fetchWeatherByCoords(city.lat, city.lon, city.name, city.country);
            };

            container.appendChild(card);
        } catch (e) {
            console.error("Failed loading world city:", city.name, e);
        }
    }
}

// Fetch Main City Telemetry
async function fetchWeatherByCoords(lat, lon, cityName, stateCountry) {
    try {
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum&timezone=auto`
        );
        const data = await weatherRes.json();
        currentWeatherData = data;
        currentCityName = cityName;

        renderHero(cityName, stateCountry, data);
        renderHourly(data.hourly);
        renderMetrics(data);
        renderForecast(data.daily);
        addRecentSearch(cityName);
    } catch (err) {
        console.error("Telemetry error:", err);
    }
}

function renderHero(cityName, stateCountry, data) {
    const cur = data.current;
    const wmo = decodeWMO(cur.weather_code);

    // Apply Weather Theme
    document.body.className = `weather-${wmo.group}`;

    document.getElementById("place-name").textContent = cityName;
    document.getElementById("place-hierarchy").textContent = stateCountry || "Global Telemetry";
    document.getElementById("temperature").textContent = formatTemp(cur.temperature_2m);
    document.getElementById("unit-symbol").textContent = isCelsius ? "°C" : "°F";
    document.getElementById("weather-desc").textContent = wmo.desc;
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${wmo.icon}@2x.png`;

    const maxT = formatTemp(data.daily.temperature_2m_max[0]);
    const minT = formatTemp(data.daily.temperature_2m_min[0]);
    document.getElementById("temp-max").textContent = maxT;
    document.getElementById("temp-min").textContent = minT;
}

function renderHourly(hourly) {
    const container = document.getElementById("hourly-container");
    container.innerHTML = "";

    const count = Math.min(24, hourly.time.length);
    for (let i = 0; i < count; i++) {
        const time = new Date(hourly.time[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const temp = formatTemp(hourly.temperature_2m[i]);
        const rain = hourly.precipitation_probability[i] || 0;
        const wmo = decodeWMO(hourly.weather_code[i]);

        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
            <span class="hour-time">${time}</span>
            <img src="https://openweathermap.org/img/wn/${wmo.icon}.png" alt="${wmo.desc}" />
            <span class="hour-temp">${temp}°</span>
            <span class="hour-rain">${rain}%</span>
        `;
        container.appendChild(card);
    }
}

function renderMetrics(data) {
    const cur = data.current;
    const daily = data.daily;

    // Feels Like
    document.getElementById("feels-like").textContent = formatTemp(cur.apparent_temperature);

    // Rain
    const rainChance = daily.precipitation_probability_max[0] || 0;
    document.getElementById("rain-chance").textContent = rainChance;
    document.getElementById("rain-bar").style.width = `${rainChance}%`;
    document.getElementById("rain-amount").textContent = `${daily.precipitation_sum[0] || 0} mm`;
    const rainBadge = document.getElementById("rain-badge");
    if (rainChance > 40) {
        rainBadge.textContent = "Rain Likely";
        rainBadge.className = "rain-status-badge rain-yes";
    } else {
        rainBadge.textContent = "No Rain";
        rainBadge.className = "rain-status-badge rain-no";
    }

    // Wind
    document.getElementById("wind-speed").textContent = Math.round(cur.wind_speed_10m);
    document.getElementById("wind-direction").textContent = `${cur.wind_direction_10m}°`;

    // UV Index
    const uv = daily.uv_index_max[0] || 0;
    document.getElementById("uv-index").textContent = uv.toFixed(1);
    document.getElementById("uv-bar").style.width = `${Math.min(100, (uv / 11) * 100)}%`;

    // Humidity
    document.getElementById("humidity-val").textContent = cur.relative_humidity_2m;
    document.getElementById("cloud-cover").textContent = `${cur.cloud_cover}%`;

    // Pressure
    document.getElementById("pressure-val").textContent = Math.round(cur.surface_pressure);

    // Sun Schedule
    const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    document.getElementById("sunrise-time").textContent = sunrise;
    document.getElementById("sunset-time").textContent = sunset;
}

function renderForecast(daily) {
    const container = document.getElementById("forecast-container");
    container.innerHTML = "";

    daily.time.forEach((day, index) => {
        const dateObj = new Date(day);
        const dayName = index === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const wmo = decodeWMO(daily.weather_code[index]);
        const max = formatTemp(daily.temperature_2m_max[index]);
        const min = formatTemp(daily.temperature_2m_min[index]);
        const rain = daily.precipitation_probability_max[index] || 0;

        const card = document.createElement("div");
        card.className = `forecast-card ${index === 0 ? "active-day" : ""}`;
        card.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-date">${dateStr}</span>
            <img src="https://openweathermap.org/img/wn/${wmo.icon}.png" alt="${wmo.desc}" />
            <span class="forecast-temp">${max}° / ${min}°</span>
            <span class="rain-prob">💧 ${rain}%</span>
        `;
        container.appendChild(card);
    });
}

// Search Geocoding
async function searchCity(query) {
    if (!query) return;
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            const desc = [loc.admin1, loc.country].filter(Boolean).join(", ");
            fetchWeatherByCoords(loc.latitude, loc.longitude, loc.name, desc);
        } else {
            alert("City not found. Please try another name.");
        }
    } catch (e) {
        console.error("Geocoding failed", e);
    }
}

// Recent Search Chips Handler
function addRecentSearch(cityName) {
    let recent = JSON.parse(localStorage.getItem("recent_cities") || "[]");
    recent = [cityName, ...recent.filter(c => c.toLowerCase() !== cityName.toLowerCase())].slice(0, 5);
    localStorage.setItem("recent_cities", JSON.stringify(recent));
    renderRecentChips();
}

function renderRecentChips() {
    const container = document.getElementById("recent-chips");
    const recent = JSON.parse(localStorage.getItem("recent_cities") || '["Delhi", "London", "Tokyo", "New York"]');
    container.innerHTML = "";
    recent.forEach(city => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.textContent = city;
        chip.onclick = () => searchCity(city);
        container.appendChild(chip);
    });
}

// Unit & Theme Switchers
document.getElementById("unit-toggle-btn").onclick = () => {
    isCelsius = !isCelsius;
    document.getElementById("unit-toggle-btn").textContent = isCelsius ? "°F" : "°C";
    if (currentWeatherData) {
        renderHero(currentCityName, "", currentWeatherData);
        renderHourly(currentWeatherData.hourly);
        renderMetrics(currentWeatherData);
        renderForecast(currentWeatherData.daily);
        loadWorldCitiesWeather();
    }
};

document.getElementById("theme-toggle-btn").onclick = () => {
    document.body.classList.toggle("light-theme");
};

// Search listeners
document.getElementById("search-btn").onclick = () => {
    const val = document.getElementById("city-input").value.trim();
    searchCity(val);
};

document.getElementById("city-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchCity(e.target.value.trim());
    }
});

// Geolocation
document.getElementById("geo-btn").onclick = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, "Your Location", "Local Area");
            },
            () => alert("Location permission denied.")
        );
    }
};

// App Initialization
window.addEventListener("DOMContentLoaded", () => {
    startClock();
    renderRecentChips();
    loadWorldCitiesWeather();
    searchCity("Delhi");
});
