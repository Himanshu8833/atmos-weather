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
    } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
        document.body.classList.add("weather-rain");
    } else if (weatherCode >= 95) {
        document.body.classList.add("weather-thunder");
    } else if (weatherCode >= 71 && weatherCode <= 77) {
        document.body.classList.add("weather-snow");
    } else {
        document.body.classList.add("weather-clouds");
    }
}

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
        if (authModal) authModal.style.display = "flex";
    } else {
        if (authModal) authModal.style.display = "none";
        if (userDisplayName) userDisplayName.innerText = `👤 ${loggedUser.name}`;
    }

    if (sendOtpBtn && otpPhoneInput) {
        sendOtpBtn.addEventListener("click", () => {
            const phone = otpPhoneInput.value.trim();
            if (!phone || phone.length < 10) {
                alert("Please enter a valid 10-digit Mobile Number!");
                return;
            }

            generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = `sms:${phone}?body=${encodeURIComponent("Your ATMOS Login OTP is " + generatedOtp)}`;
            }

            if (smsToast && smsToastContent) {
                if (smsToastHeader) smsToastHeader.innerText = `SMS to +91 ${phone}`;
                smsToastContent.innerHTML = `Your ATMOS login OTP is <b>${generatedOtp}</b>. Valid for 60s.`;
                smsToast.style.display = "flex";
                setTimeout(() => { smsToast.style.display = "none"; }, 9000);
            }

            if (otpCodeGroup) otpCodeGroup.style.display = "flex";
            if (otpSubmitBtn) otpSubmitBtn.style.display = "block";
            if (otpCodeInput) {
                otpCodeInput.value = "";
                otpCodeInput.focus();
            }

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
    }

    if (otpForm) {
        otpForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const enteredOtp = otpCodeInput ? otpCodeInput.value.trim() : "";
            const phone = otpPhoneInput ? otpPhoneInput.value.trim() : "";

            if (!enteredOtp) {
                alert("Please enter the 4-digit OTP code!");
                return;
            }

            if (enteredOtp === generatedOtp) {
                const userObj = { name: `+91 ${phone}`, phone: phone };
                localStorage.setItem("atmos_logged_user", JSON.stringify(userObj));
                if (userDisplayName) userDisplayName.innerText = `👤 ${userObj.name}`;
                if (authModal) authModal.style.display = "none";
                clearInterval(otpTimer);
                alert("Logged in successfully! Welcome to ATMOS Live.");
            } else {
                alert("Incorrect OTP! Please check the notification message.");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("atmos_logged_user");
            if (authModal) authModal.style.display = "flex";
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
    if (tempC === undefined || tempC === null || isNaN(tempC)) return "--";
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

        alert(`Place "${query}" not found! Try searching another city.`);
    } catch (error) {
        console.error("Search Error:", error);
    }
}

async function fetchFullData(lat, lon, displayName, hierarchyText) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (!data.current || !data.daily) return;

        globalWeeklyData = data.daily;
        globalHourlyData = data.hourly;
        selectedDayIndex = 0;

        currentTempC = data.current.temperature_2m;
        currentFeelsC = data.current.apparent_temperature;
        currentMinTempC = data.daily.temperature_2m_min[0];
        currentMaxTempC = data.daily.temperature_2m_max[0];

        const placeNameEl = document.getElementById("place-name");
        const hierarchyEl = document.getElementById("place-hierarchy");
        const tempEl = document.getElementById("temperature");
        const feelsLikeEl = document.getElementById("feels-like");
        const weatherDescEl = document.getElementById("weather-desc");
        const weatherIconEl = document.getElementById("weather-icon");
        const windSpeedEl = document.getElementById("wind-speed");
        const windDirectionEl = document.getElementById("wind-direction");
        const sunriseTimeEl = document.getElementById("sunrise-time");
        const sunsetTimeEl = document.getElementById("sunset-time");
        const humidityValEl = document.getElementById("humidity-val");
        const pressureValEl = document.getElementById("pressure-val");
        const visibilityValEl = document.getElementById("visibility-val");
        const cloudCoverEl = document.getElementById("cloud-cover");
        const dewPointEl = document.getElementById("dew-point");
        const badgeEl = document.getElementById("selected-day-badge");

        if (badgeEl) badgeEl.innerText = "Showing: Today (Live)";
        if (placeNameEl) placeNameEl.innerText = displayName;
        if (hierarchyEl) hierarchyEl.innerText = hierarchyText;
        if (tempEl) tempEl.innerText = convertTemp(currentTempC);
        if (feelsLikeEl) feelsLikeEl.innerText = convertTemp(currentFeelsC);

        const cond = getWeatherCondition(data.current.weather_code);
        if (weatherDescEl) weatherDescEl.innerText = cond.text;
        if (weatherIconEl) weatherIconEl.src = `https://openweathermap.org/img/wn/${cond.icon}@2x.png`;

        if (humidityValEl) humidityValEl.innerText = data.current.relative_humidity_2m;
        if (pressureValEl) pressureValEl.innerText = Math.round(data.current.surface_pressure);
        if (visibilityValEl) visibilityValEl.innerText = "10.0";
        if (cloudCoverEl) cloudCoverEl.innerText = `${data.current.cloud_cover}%`;

        if (windSpeedEl) windSpeedEl.innerText = Math.round(data.current.wind_speed_10m);
        if (windDirectionEl) windDirectionEl.innerText = getCompassDirection(data.current.wind_direction_10m);

        const dew = Math.round(currentTempC - ((100 - data.current.relative_humidity_2m) / 5));
        if (dewPointEl) dewPointEl.innerText = `${dew}°C`;

        if (sunriseTimeEl && data.daily.sunrise && data.daily.sunrise[0]) {
            sunriseTimeEl.innerText = data.daily.sunrise[0].slice(11, 16);
        }
        if (sunsetTimeEl && data.daily.sunset && data.daily.sunset[0]) {
            sunsetTimeEl.innerText = data.daily.sunset[0].slice(11, 16);
        }

        updateMinMaxDisplay();
        applyWeatherTheme(data.current.weather_code);

        const todayUv = data.daily.uv_index_max ? data.daily.uv_index_max[0] : 0;
        updateUvIndex(todayUv);
        updateRainSection(data.daily.precipitation_probability_max[0] || 0, data.daily.precipitation_sum[0] || 0);

        renderHourlyTimeline();
        renderForecastCards();
        fetchAirQuality(lat, lon);
    } catch (error) {
        console.error("Data Fetch Error:", error);
    }
}

async function fetchAirQuality(lat, lon) {
    try {
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,us_aqi`;
        const res = await fetch(aqiUrl);
        const aqiData = await res.json();

        const aqiValueEl = document.getElementById("aqi-value");
        const aqiLabelEl = document.getElementById("aqi-label");
        const aqiAdviceEl = document.getElementById("aqi-advice");

        if (aqiData.current) {
            const pm25 = Math.round(aqiData.current.pm2_5 || 25);
            if (aqiValueEl) aqiValueEl.innerText = pm25;

            if (pm25 <= 30) {
                if (aqiLabelEl) { aqiLabelEl.innerText = "GOOD"; aqiLabelEl.style.color = "#16a34a"; aqiLabelEl.style.background = "rgba(56, 239, 125, 0.2)"; }
                if (aqiAdviceEl) aqiAdviceEl.innerText = "Air is clean & fresh. Great for outdoor walks.";
            } else if (pm25 <= 60) {
                if (aqiLabelEl) { aqiLabelEl.innerText = "FAIR"; aqiLabelEl.style.color = "#16a34a"; aqiLabelEl.style.background = "rgba(168, 255, 120, 0.2)"; }
                if (aqiAdviceEl) aqiAdviceEl.innerText = "Air quality is acceptable.";
            } else if (pm25 <= 90) {
                if (aqiLabelEl) { aqiLabelEl.innerText = "MODERATE"; aqiLabelEl.style.color = "#ca8a04"; aqiLabelEl.style.background = "rgba(255, 215, 0, 0.2)"; }
                if (aqiAdviceEl) aqiAdviceEl.innerText = "Sensitive individuals take care.";
            } else {
                if (aqiLabelEl) { aqiLabelEl.innerText = "POOR"; aqiLabelEl.style.color = "#dc2626"; aqiLabelEl.style.background = "rgba(255, 69, 0, 0.2)"; }
                if (aqiAdviceEl) aqiAdviceEl.innerText = "Unhealthy air. Avoid heavy outdoor exercises.";
            }
        }
    } catch (err) {
        console.error("AQI error:", err);
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
        const code = (globalHourlyData.weather_code && globalHourlyData.weather_code[i] !== undefined) 
            ? globalHourlyData.weather_code[i] 
            : (globalHourlyData.weathercode ? globalHourlyData.weathercode[i] : 0);
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

    if (uvEl) uvEl.innerText = uvVal ? uvVal.toFixed(1) : "0.0";
    if (uvBarEl) uvBarEl.style.width = `${Math.min(((uvVal || 0) / 11) * 100, 100)}%`;

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
        const weatherCode = (globalWeeklyData.weather_code && globalWeeklyData.weather_code[i] !== undefined)
            ? globalWeeklyData.weather_code[i]
            : (globalWeeklyData.weathercode ? globalWeeklyData.weathercode[i] : 0);
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

    const weatherCode = (globalWeeklyData.weather_code && globalWeeklyData.weather_code[dayIndex] !== undefined)
        ? globalWeeklyData.weather_code[dayIndex]
        : (globalWeeklyData.weathercode ? globalWeeklyData.weathercode[dayIndex] : 0);
    const condition = getWeatherCondition(weatherCode);
    applyWeatherTheme(weatherCode);

    if (tempEl) tempEl.innerText = convertTemp(currentTempC);
    if (descEl) descEl.innerText = condition.text;
    if (iconEl) iconEl.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;

    const rainProb = globalWeeklyData.precipitation_probability_max ? globalWeeklyData.precipitation_probability_max[dayIndex] : 0;
    const rainSum = globalWeeklyData.precipitation_sum ? globalWeeklyData.precipitation_sum[dayIndex] : 0;
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
