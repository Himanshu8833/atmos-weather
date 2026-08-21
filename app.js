const API_KEY = "64528fad1108fb8bbb87f42eac711996";
const DEFAULT_QUERY = "Delhi";

let currentTempC = 0;
let currentMinTempC = 0;
let currentMaxTempC = 0;
let currentFeelsC = 0;
let isFahrenheit = false;
let globalWeeklyData = null;
let globalHourlyData = null;
let selectedDayIndex = 0;

let generatedOtp = null;
let otpTimer = null;

function applyWeatherTheme(weatherCode) {
    document.body.classList.remove(
        "weather-clear",
        "weather-rain",
        "weather-clouds",
        "weather-thunder",
        "weather-snow"
    );

    if (weatherCode === 0) {
        document.body.classList.add("weather-clear");
    } else if (weatherCode >= 51 && weatherCode <= 67) {
        document.body.classList.add("weather-rain");
    } else if (weatherCode >= 80 && weatherCode <= 82) {
        document.body.classList.add("weather-rain");
    } else if (weatherCode >= 95) {
        document.body.classList.add("weather-thunder");
    } else if (weatherCode >= 71 && weatherCode <= 77) {
        document.body.classList.add("weather-snow");
    } else {
        document.body.classList.add("weather-clouds");
    }
}

// 1. Direct Phone Number OTP Login (Without Servers)
function setupAuthManager() {
    const authModal = document.getElementById("auth-modal");
    const userDisplayName = document.getElementById("user-display-name");
    const logoutBtn = document.getElementById("logout-btn");

    const otpForm = document.getElementById("otp-form");
    const sendOtpBtn = document.getElementById("send-otp-btn");
    const otpPhoneInput = document.getElementById("otp-phone-input");
    const otpCodeGroup = document.getElementById("otp-code-group");
    const otpCodeInput = document.getElementById("otp-code-input");
    const otpSubmitBtn = document.getElementById("otp-submit-btn");

    const smsToast = document.getElementById("sms-toast");
    const smsToastHeader = document.getElementById("sms-toast-header");
    const smsToastContent = document.getElementById("sms-toast-content");

    const loggedUser = JSON.parse(localStorage.getItem("atmos_logged_user"));
    if (!loggedUser) {
        authModal.style.display = "flex";
    } else {
        authModal.style.display = "none";
        if (userDisplayName) userDisplayName.innerText = `👤 ${loggedUser.name}`;
    }

    sendOtpBtn.addEventListener("click", () => {
        const phone = otpPhoneInput.value.trim();
        if (!phone || phone.length < 10) {
            alert("Please enter a valid 10-digit Mobile Number!");
            return;
        }

        generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // 1. Trigger Direct Device Messaging App without server
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = `sms:${phone}?body=${encodeURIComponent("Your ATMOS Login OTP is " + generatedOtp)}`;
        }

        // 2. Show native message card directed to that specific number
        if (smsToast && smsToastContent) {
            smsToastHeader.innerText = `SMS to +91 ${phone}`;
            smsToastContent.innerHTML = `Your ATMOS login OTP is <b>${generatedOtp}</b>. Valid for 60s.`;
            smsToast.style.display = "flex";
            setTimeout(() => { smsToast.style.display = "none"; }, 9000);
        }

        // Reveal OTP Input
        otpCodeGroup.style.display = "flex";
        otpSubmitBtn.style.display = "block";
        otpCodeInput.value = "";
        otpCodeInput.focus();

        let timeLeft = 60;
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerText = `${timeLeft}s`;

        clearInterval(otpTimer);
        otpTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(otpTimer);
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerText = "Resend OTP";
            } else {
                sendOtpBtn.innerText = `${timeLeft}s`;
            }
        }, 1000);
    });

    otpForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredOtp = otpCodeInput.value.trim();
        const phone = otpPhoneInput.value.trim();

        if (!enteredOtp) {
            alert("Please enter the 4-digit OTP code!");
            return;
        }

        if (enteredOtp === generatedOtp) {
            const userObj = { name: `+91 ${phone}`, phone: phone };
            localStorage.setItem("atmos_logged_user", JSON.stringify(userObj));
            if (userDisplayName) userDisplayName.innerText = `👤 ${userObj.name}`;
            authModal.style.display = "none";
            clearInterval(otpTimer);
            alert("Logged in successfully! Welcome to ATMOS Live.");
        } else {
            alert("Incorrect OTP! Please check the code sent to your number.");
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("atmos_logged_user");
            authModal.style.display = "flex";
            if (userDisplayName) userDisplayName.innerText = "Guest";
        });
    }
}

function setupThemeManager() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    const savedTheme = localStorage.getItem("atmos_theme") || "dark";

    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        if (themeBtn) themeBtn.innerText = "☀️";
    } else {
        document.body.classList.remove("light-theme");
        if (themeBtn) themeBtn.innerText = "🌙";
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("light-theme");
            const isLight = document.body.classList.contains("light-theme");
            themeBtn.innerText = isLight ? "☀️" : "🌙";
            localStorage.setItem("atmos_theme", isLight ? "light" : "dark");
        });
    }
}

function startLiveClock() {
    const clockEl = document.getElementById("live-clock");
    function updateClock() {
        const now = new Date();
        const datePart = now.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        const timePart = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: true 
        });

        if (clockEl) {
            clockEl.innerHTML = `<span class="clock-date">${datePart}</span> <span class="clock-dot">•</span> <span class="clock-time">${timePart}</span>`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function convertTemp(tempC) {
    if (tempC === undefined || tempC === null) return "--";
    return isFahrenheit ? Math.round((tempC * 9/5) + 32) : Math.round(tempC);
}

function getWeatherCondition(code) {
    if (code === 0) return { icon: "01d", text: "Clear Sky" };
    if (code >= 1 && code <= 3) return { icon: "02d", text: "Partly Cloudy" };
    if (code === 45 || code === 48) return { icon: "50d", text: "Foggy" };
    if (code >= 51 && code <= 57) return { icon: "10d", text: "Light Rain / Drizzle" };
    if (code >= 61 && code <= 67) return { icon: "10d", text: "Heavy Rain" };
    if (code >= 71 && code <= 77) return { icon: "13d", text: "Snowfall" };
    if (code >= 80 && code <= 82) return { icon: "09d", text: "Rain Showers" };
    if (code >= 95) return { icon: "11d", text: "Thunderstorm" };
    return { icon: "03d", text: "Cloudy" };
}

function getCompassDirection(deg) {
    if (deg === undefined || deg === null) return "NW";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(deg / 45) % 8];
}

function formatSunTime(unixTimestamp, timezoneOffset) {
    if (!unixTimestamp) return "--:--";
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    return date.toUTCString().slice(17, 22);
}

function saveSearchToHistory(placeName) {
    if (!placeName) return;
    let searches = JSON.parse(localStorage.getItem("weather_recent_searches")) || ["Delhi", "Mathura", "Noida"];
    searches = searches.filter(item => item.toLowerCase() !== placeName.toLowerCase());
    searches.unshift(placeName);
    if (searches.length > 5) searches.pop();

    localStorage.setItem("weather_recent_searches", JSON.stringify(searches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const container = document.getElementById("recent-chips");
    if (!container) return;

    const searches = JSON.parse(localStorage.getItem("weather_recent_searches")) || ["Delhi", "Mathura", "Noida"];
    container.innerHTML = "";

    searches.forEach(place => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerText = place;
        chip.addEventListener("click", () => universalSearch(place));
        container.appendChild(chip);
    });
}

async function universalSearch(query) {
    try {
        const cleanQuery = encodeURIComponent(query.trim());
        const meteoGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cleanQuery}&count=1&language=en&format=json`;
        const res = await fetch(meteoGeoUrl);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            const name = loc.name;
            const district = loc.admin2 || loc.admin3 || "";
            const state = loc.admin1 || "";
            const country = loc.country || "";

            const hierarchyText = [district, state, country].filter(Boolean).join(", ");
            saveSearchToHistory(name);
            fetchFullData(loc.latitude, loc.longitude, name, hierarchyText);
            return;
        }

        const owmGeoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cleanQuery}&limit=1&appid=${API_KEY}`;
        const owmRes = await fetch(owmGeoUrl);
        const owmData = await owmRes.json();

        if (owmData && owmData.length > 0) {
            const owmLoc = owmData[0];
            const name = owmLoc.name;
            const hierarchyText = [owmLoc.state, owmLoc.country].filter(Boolean).join(", ");
            saveSearchToHistory(name);
            fetchFullData(owmLoc.lat, owmLoc.lon, name, hierarchyText);
            return;
        }

        alert(`Place "${query}" not found! Try searching nearby District or Tehsil name.`);
    } catch (error) {
        console.error("Search Error:", error);
    }
}

async function fetchFullData(lat, lon, displayName, hierarchyText) {
    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const res = await fetch(weatherUrl);
        const data = await res.json();

        data.customDisplayName = displayName;
        data.customHierarchy = hierarchyText;

        selectedDayIndex = 0;
        updateUI(data);
        fetchAirQuality(lat, lon);
        fetchDeepTelemetryAndForecast(lat, lon);
    } catch (error) {
        console.error("Data Fetch Error:", error);
    }
}

async function fetchAirQuality(lat, lon) {
    try {
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const res = await fetch(aqiUrl);
        const aqiData = await res.json();

        const aqiValueEl = document.getElementById("aqi-value");
        const aqiLabelEl = document.getElementById("aqi-label");
        const aqiAdviceEl = document.getElementById("aqi-advice");

        if (aqiData.list && aqiData.list.length > 0) {
            const aqiIndex = aqiData.list[0].main.aqi;
            const pm25 = Math.round(aqiData.list[0].components.pm2_5);

            if (aqiValueEl) aqiValueEl.innerText = pm25;

            const aqiMap = {
                1: { text: "GOOD", advice: "Air is clean & fresh. Great for outdoor walks.", color: "#16a34a", bg: "rgba(56, 239, 125, 0.2)" },
                2: { text: "FAIR", advice: "Air quality is normal & acceptable.", color: "#16a34a", bg: "rgba(168, 255, 120, 0.2)" },
                3: { text: "MODERATE", advice: "Moderate air. Sensitive individuals take care.", color: "#ca8a04", bg: "rgba(255, 215, 0, 0.2)" },
                4: { text: "POOR", advice: "Unhealthy air. Avoid heavy outdoor exercises.", color: "#ea580c", bg: "rgba(255, 165, 0, 0.2)" },
                5: { text: "VERY POOR", advice: "Hazardous air quality. Wear a mask outdoors.", color: "#dc2626", bg: "rgba(255, 69, 0, 0.2)" }
            };

            const currentAqi = aqiMap[aqiIndex] || aqiMap[1];
            if (aqiLabelEl) {
                aqiLabelEl.innerText = currentAqi.text;
                aqiLabelEl.style.color = currentAqi.color;
                aqiLabelEl.style.backgroundColor = currentAqi.bg;
            }
            if (aqiAdviceEl) aqiAdviceEl.innerText = currentAqi.advice;
        }
    } catch (err) {
        console.error("AQI error:", err);
    }
}

async function fetchDeepTelemetryAndForecast(lat, lon) {
    try {
        const deepUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto`;
        const res = await fetch(deepUrl);
        const data = await res.json();
        
        if (!data.daily || !data.hourly) return;
        globalWeeklyData = data.daily;
        globalHourlyData = data.hourly;

        renderHourlyTimeline();
        renderForecastCards();

        currentMinTempC = globalWeeklyData.temperature_2m_min[0];
        currentMaxTempC = globalWeeklyData.temperature_2m_max[0];
        updateMinMaxDisplay();

        const todayWeatherCode = globalWeeklyData.weathercode[0];
        applyWeatherTheme(todayWeatherCode);

        const todayUv = globalWeeklyData.uv_index_max ? globalWeeklyData.uv_index_max[0] : 0;
        updateUvIndex(todayUv);

        updateRainSection(globalWeeklyData.precipitation_probability_max[0], globalWeeklyData.precipitation_sum[0]);
    } catch (err) {
        console.error("Telemetry fetch error:", err);
    }
}

function renderHourlyTimeline() {
    const hourlyContainer = document.getElementById("hourly-container");
    if (!hourlyContainer || !globalHourlyData) return;

    hourlyContainer.innerHTML = "";
    
    const now = new Date();
    const currentHourStr = now.toISOString().slice(0, 13);
    let startIndex = globalHourlyData.time.findIndex(t => t.startsWith(currentHourStr));
    if (startIndex === -1) startIndex = 0;

    for (let i = startIndex; i < startIndex + 24 && i < globalHourlyData.time.length; i++) {
        const timeObj = new Date(globalHourlyData.time[i]);
        const hourLabel = i === startIndex ? "Now" : timeObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        const temp = convertTemp(globalHourlyData.temperature_2m[i]);
        const code = globalHourlyData.weathercode[i];
        const cond = getWeatherCondition(code);
        const rainChance = globalHourlyData.precipitation_probability ? globalHourlyData.precipitation_probability[i] : 0;

        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
            <span class="hour-time">${hourLabel}</span>
            <img src="https://openweathermap.org/img/wn/${cond.icon}.png" alt="${cond.text}" />
            <span class="hour-temp">${temp}°</span>
            <span class="hour-rain">${rainChance > 0 ? `💧${rainChance}%` : '•'}</span>
        `;
        hourlyContainer.appendChild(card);
    }
}

function updateMinMaxDisplay() {
    const minEl = document.getElementById("temp-min");
    const maxEl = document.getElementById("temp-max");
    if (minEl) minEl.innerText = convertTemp(currentMinTempC);
    if (maxEl) maxEl.innerText = convertTemp(currentMaxTempC);
}

function updateUvIndex(uvVal) {
    const uvEl = document.getElementById("uv-index");
    const uvBarEl = document.getElementById("uv-bar");
    const uvRiskEl = document.getElementById("uv-risk");

    if (uvEl) uvEl.innerText = uvVal.toFixed(1);
    if (uvBarEl) uvBarEl.style.width = `${Math.min((uvVal / 11) * 100, 100)}%`;

    if (uvRiskEl) {
        if (uvVal >= 8) {
            uvRiskEl.innerText = "Very High Risk - Use Sunscreen";
            uvRiskEl.style.color = "#dc2626";
        } else if (uvVal >= 5) {
            uvRiskEl.innerText = "Moderate Risk - Wear Hat";
            uvRiskEl.style.color = "#ca8a04";
        } else {
            uvRiskEl.innerText = "Low Risk - Safe Outside";
            uvRiskEl.style.color = "#16a34a";
        }
    }
}

function renderForecastCards() {
    const forecastContainer = document.getElementById("forecast-container");
    if (!forecastContainer || !globalWeeklyData) return;

    forecastContainer.innerHTML = "";

    for (let i = 0; i < globalWeeklyData.time.length; i++) {
        const date = new Date(globalWeeklyData.time[i]);
        const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
        const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const maxTemp = convertTemp(globalWeeklyData.temperature_2m_max[i]);
        const weatherCode = globalWeeklyData.weathercode[i];
        const condition = getWeatherCondition(weatherCode);
        const rainProb = globalWeeklyData.precipitation_probability_max ? globalWeeklyData.precipitation_probability_max[i] : 0;

        const card = document.createElement("div");
        card.className = `forecast-card ${i === selectedDayIndex ? 'active-day' : ''}`;
        card.id = `forecast-card-${i}`;
        card.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-date">${formattedDate}</span>
            <img src="https://openweathermap.org/img/wn/${condition.icon}.png" alt="${condition.text}" />
            <span class="forecast-temp">${maxTemp}°</span>
            <span class="rain-prob">💧 ${rainProb}%</span>
        `;

        card.addEventListener("click", () => selectDayForecast(i));
        forecastContainer.appendChild(card);
    }
}

function selectDayForecast(dayIndex) {
    if (!globalWeeklyData) return;
    selectedDayIndex = dayIndex;

    document.querySelectorAll(".forecast-card").forEach(c => c.classList.remove("active-day"));
    const activeCard = document.getElementById(`forecast-card-${dayIndex}`);
    if (activeCard) activeCard.classList.add("active-day");

    const date = new Date(globalWeeklyData.time[dayIndex]);
    const dayLabel = dayIndex === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    
    const badgeEl = document.getElementById("selected-day-badge");
    if (badgeEl) badgeEl.innerText = `Showing: ${dayLabel}`;

    const tempEl = document.getElementById("temperature");
    const descEl = document.getElementById("weather-desc");
    const iconEl = document.getElementById("weather-icon");

    currentTempC = globalWeeklyData.temperature_2m_max[dayIndex];
    currentMinTempC = globalWeeklyData.temperature_2m_min[dayIndex];
    currentMaxTempC = globalWeeklyData.temperature_2m_max[dayIndex];
    updateMinMaxDisplay();

    const condition = getWeatherCondition(globalWeeklyData.weathercode[dayIndex]);
    applyWeatherTheme(globalWeeklyData.weathercode[dayIndex]);

    if (tempEl) tempEl.innerText = convertTemp(currentTempC);
    if (descEl) descEl.innerText = condition.text;
    if (iconEl) iconEl.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;

    const rainProb = globalWeeklyData.precipitation_probability_max[dayIndex] || 0;
    const rainSum = globalWeeklyData.precipitation_sum[dayIndex] || 0;
    updateRainSection(rainProb, rainSum);

    const uv = globalWeeklyData.uv_index_max ? globalWeeklyData.uv_index_max[dayIndex] : 0;
    updateUvIndex(uv);

    const windSpeedEl = document.getElementById("wind-speed");
    if (windSpeedEl && globalWeeklyData.wind_speed_10m_max) {
        windSpeedEl.innerText = Math.round(globalWeeklyData.wind_speed_10m_max[dayIndex]);
    }
}

function updateRainSection(rainChance, rainAmount) {
    const rainChanceEl = document.getElementById("rain-chance");
    const rainBarEl = document.getElementById("rain-bar");
    const rainAmountEl = document.getElementById("rain-amount");
    const rainBadgeEl = document.getElementById("rain-badge");

    if (rainChanceEl) rainChanceEl.innerText = rainChance;
    if (rainBarEl) rainBarEl.style.width = `${rainChance}%`;
    if (rainAmountEl) rainAmountEl.innerText = `${rainAmount.toFixed(1)} mm`;

    if (rainBadgeEl) {
        if (rainChance >= 60 || rainAmount > 2.0) {
            rainBadgeEl.innerText = "🌧️ Heavy Rain Alert";
            rainBadgeEl.className = "rain-status-badge rain-yes";
        } else if (rainChance >= 30) {
            rainBadgeEl.innerText = "🌦️ Light Rain Expected";
            rainBadgeEl.className = "rain-status-badge rain-yes";
        } else {
            rainBadgeEl.innerText = "☀️ No Rain Expected";
            rainBadgeEl.className = "rain-status-badge rain-no";
        }
    }
}

function updateUI(data) {
    const placeNameEl = document.getElementById("place-name");
    const hierarchyEl = document.getElementById("place-hierarchy");
    const tempEl = document.getElementById("temperature");
    const weatherDescEl = document.getElementById("weather-desc");
    const weatherIconEl = document.getElementById("weather-icon");
    const windSpeedEl = document.getElementById("wind-speed");
    const windDirectionEl = document.getElementById("wind-direction");
    const sunriseTimeEl = document.getElementById("sunrise-time");
    const sunsetTimeEl = document.getElementById("sunset-time");
    const feelsLikeEl = document.getElementById("feels-like");
    const humidityValEl = document.getElementById("humidity-val");
    const pressureValEl = document.getElementById("pressure-val");
    const visibilityValEl = document.getElementById("visibility-val");
    const cloudCoverEl = document.getElementById("cloud-cover");
    const dewPointEl = document.getElementById("dew-point");
    const badgeEl = document.getElementById("selected-day-badge");

    if (badgeEl) badgeEl.innerText = "Showing: Today (Live)";
    if (placeNameEl) placeNameEl.innerText = data.customDisplayName || data.name;
    if (hierarchyEl) hierarchyEl.innerText = data.customHierarchy || (data.sys ? `${data.sys.country}` : "");

    currentTempC = data.main.temp;
    currentFeelsC = data.main.feels_like;
    if (tempEl) tempEl.innerText = convertTemp(currentTempC);
    if (feelsLikeEl) feelsLikeEl.innerText = convertTemp(currentFeelsC);

    if (humidityValEl) humidityValEl.innerText = data.main.humidity;
    if (pressureValEl) pressureValEl.innerText = data.main.pressure;
    if (visibilityValEl) visibilityValEl.innerText = (data.visibility / 1000).toFixed(1);
    if (cloudCoverEl && data.clouds) cloudCoverEl.innerText = `${data.clouds.all}%`;

    const temp = data.main.temp;
    const hum = data.main.humidity;
    const dewPoint = Math.round(temp - ((100 - hum) / 5));
    if (dewPointEl) dewPointEl.innerText = `${dewPoint}°C`;

    if (weatherDescEl && data.weather && data.weather.length > 0) {
        weatherDescEl.innerText = data.weather[0].description;
    }
    if (weatherIconEl && data.weather && data.weather.length > 0) {
        weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    }

    if (windSpeedEl && data.wind) {
        windSpeedEl.innerText = Math.round(data.wind.speed * 3.6);
    }
    if (windDirectionEl && data.wind) {
        windDirectionEl.innerText = getCompassDirection(data.wind.deg);
    }

    if (data.sys && data.timezone !== undefined) {
        if (sunriseTimeEl) sunriseTimeEl.innerText = formatSunTime(data.sys.sunrise, data.timezone);
        if (sunsetTimeEl) sunsetTimeEl.innerText = formatSunTime(data.sys.sunset, data.timezone);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupAuthManager();
    setupThemeManager();
    startLiveClock();
    renderRecentSearches();

    const cityInput = document.getElementById("city-input");
    const searchBtn = document.getElementById("search-btn");
    const geoBtn = document.getElementById("geo-btn");
    const unitToggleBtn = document.getElementById("unit-toggle-btn");
    const unitSymbol = document.getElementById("unit-symbol");
    const tempEl = document.getElementById("temperature");
    const feelsLikeEl = document.getElementById("feels-like");

    function handleSearch() {
        const query = cityInput.value.trim();
        if (query !== "") {
            universalSearch(query);
            cityInput.value = "";
        }
    }

    if (searchBtn && cityInput) {
        searchBtn.addEventListener("click", handleSearch);
        cityInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleSearch();
        });
    }

    if (geoBtn) {
        geoBtn.addEventListener("click", () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => fetchFullData(pos.coords.latitude, pos.coords.longitude, "Your Location", "Local Area"),
                    () => alert("Location permission denied.")
                );
            }
        });
    }

    if (unitToggleBtn) {
        unitToggleBtn.addEventListener("click", () => {
            isFahrenheit = !isFahrenheit;
            unitToggleBtn.innerText = isFahrenheit ? "°C" : "°F";
            if (unitSymbol) unitSymbol.innerText = isFahrenheit ? "°F" : "°C";
            if (tempEl) tempEl.innerText = convertTemp(currentTempC);
            if (feelsLikeEl) feelsLikeEl.innerText = convertTemp(currentFeelsC);
            updateMinMaxDisplay();
            renderHourlyTimeline();
            renderForecastCards();
        });
    }

    universalSearch(DEFAULT_QUERY);
});
