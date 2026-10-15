
(() => {
    "use strict";

    // ==========================================
    // 1. RECENT SEARCHES & HISTORY MANAGEMENT
    // ==========================================

    const STORAGE_KEY = "atmos_recent_searches";
    const DEFAULT_CITIES = ["Delhi", "Mumbai", "Bengaluru"];
    const MAX_RECENT = 6;

    const $ = (id) => document.getElementById(id);

    function readRecentSearches() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved === null) return [...DEFAULT_CITIES];

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) return [...DEFAULT_CITIES];

            return parsed
                .filter(city => typeof city === "string" && city.trim())
                .map(city => city.trim())
                .filter((city, index, arr) =>
                    arr.findIndex(item =>
                        item.toLowerCase() === city.toLowerCase()
                    ) === index
                )
                .slice(0, MAX_RECENT);
        } catch (error) {
            console.warn("Unable to read search history:", error);
            return [...DEFAULT_CITIES];
        }
    }

    let recentSearches = readRecentSearches();

    function saveRecentSearches() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(recentSearches)
            );
        } catch (error) {
            console.warn("Unable to save search history:", error);
        }
    }

    function renderRecentSearches() {
        const container = $("recent-chips");
        if (!container) return;

        container.replaceChildren();

        if (recentSearches.length === 0) {
            const message = document.createElement("span");
            message.className = "recent-empty-message";
            message.textContent = "No recent searches";
            message.style.fontSize = "11px";
            message.style.color = "var(--text-grey)";
            container.appendChild(message);
            return;
        }

        recentSearches.forEach(city => {
            const chip = document.createElement("div");
            chip.className = "chip";

            const name = document.createElement("span");
            name.className = "chip-name";
            name.textContent = city;
            name.tabIndex = 0;
            name.setAttribute("role", "button");
            name.setAttribute("aria-label", `Search weather for ${city}`);

            const searchCity = () => {
                const input = $("city-input");
                if (input) input.value = city;

                if (typeof window.fetchWeatherByCity === "function") {
                    window.fetchWeatherByCity(city);
                } else {
                    $("search-btn")?.click();
                }
            };

            name.addEventListener("click", searchCity);
            name.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    searchCity();
                }
            });

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "chip-remove-btn";
            removeBtn.textContent = "\u00D7";
            removeBtn.title = `Remove ${city}`;
            removeBtn.setAttribute("aria-label", `Remove ${city}`);

            removeBtn.addEventListener("click", () => {
                removeRecentSearch(city);
            });

            chip.append(name, removeBtn);
            container.appendChild(chip);
        });

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "clear-history-btn";
        clearBtn.textContent = "Clear All";
        clearBtn.addEventListener("click", clearAllSearches);

        container.appendChild(clearBtn);
    }

    function addRecentSearch(cityName) {
        if (typeof cityName !== "string" || !cityName.trim()) return;

        const city = cityName.trim();

        recentSearches = recentSearches.filter(
            item => item.toLowerCase() !== city.toLowerCase()
        );

        recentSearches.unshift(city);
        recentSearches = recentSearches.slice(0, MAX_RECENT);

        saveRecentSearches();
        renderRecentSearches();
    }

    function removeRecentSearch(cityName) {
        recentSearches = recentSearches.filter(
            item => item.toLowerCase() !== cityName.toLowerCase()
        );

        saveRecentSearches();
        renderRecentSearches();
    }

    function clearAllSearches() {
        recentSearches = [];

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn("Unable to clear search history:", error);
        }

        renderRecentSearches();
    }

    // Make history functions available to app.js if needed.
    window.addRecentSearch = addRecentSearch;
    window.removeRecentSearch = removeRecentSearch;
    window.clearAllSearches = clearAllSearches;
    window.renderRecentSearches = renderRecentSearches;

    // ==========================================
    // 2. SAFE AUTOCOMPLETE
    // ==========================================

    const cityInput = $("city-input");
    const dropdown = $("search-dropdown");

    let debounceTimer;
    let activeController = null;
    let latestQuery = "";

    function closeDropdown() {
        dropdown?.classList.remove("show");
    }

    function showDropdownMessage(message) {
        if (!dropdown) return;

        dropdown.replaceChildren();

        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.style.cursor = "default";

        const label = document.createElement("span");
        label.className = "item-main";
        label.textContent = message;

        item.appendChild(label);
        dropdown.appendChild(item);
        dropdown.classList.add("show");
    }

    async function fetchLocationSuggestions(query) {
        if (!dropdown) return;

        if (activeController) {
            activeController.abort();
        }

        const controller = new AbortController();
        activeController = controller;
        latestQuery = query;

        try {
            const params = new URLSearchParams({
                name: query,
                count: "6",
                language: "en",
                format: "json"
            });

            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?${params}`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Ignore stale responses.
            if (
                controller.signal.aborted ||
                latestQuery !== query ||
                cityInput?.value.trim() !== query
            ) {
                return;
            }

            dropdown.replaceChildren();

            if (!Array.isArray(data.results) || data.results.length === 0) {
                showDropdownMessage("No locations found");
                return;
            }

            data.results.forEach(loc => {
                if (
                    typeof loc.name !== "string" ||
                    !Number.isFinite(loc.latitude) ||
                    !Number.isFinite(loc.longitude)
                ) {
                    return;
                }

                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.tabIndex = 0;
                item.setAttribute("role", "button");

                const main = document.createElement("span");
                main.className = "item-main";
                main.textContent = loc.name;

                const parts = [
                    loc.admin2,
                    loc.admin1,
                    loc.country
                ].filter(Boolean);

                const sub = document.createElement("span");
                sub.className = "item-sub";
                sub.textContent = parts.join(", ");

                item.append(main, sub);

                const selectLocation = () => {
                    cityInput.value = loc.name;
                    closeDropdown();

                    const hierarchy = parts.join(", ");

                    if (typeof window.fetchWeatherByCoords === "function") {
                        window.fetchWeatherByCoords(
                            loc.latitude,
                            loc.longitude,
                            loc.name,
                            hierarchy
                        );
                    } else if (
                        typeof window.fetchWeatherByCity === "function"
                    ) {
                        window.fetchWeatherByCity(loc.name);
                    } else {
                        $("search-btn")?.click();
                    }
                };

                item.addEventListener("click", selectLocation);

                item.addEventListener("keydown", event => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectLocation();
                    }
                });

                dropdown.appendChild(item);
            });

            if (dropdown.childElementCount === 0) {
                showDropdownMessage("No valid locations found");
                return;
            }

            dropdown.classList.add("show");
        } catch (error) {
            if (error.name === "AbortError") return;

            console.error("Autocomplete request failed:", error);

            if (latestQuery === query) {
                showDropdownMessage("Unable to load locations. Try again.");
            }
        }
    }

    if (cityInput && dropdown) {
        cityInput.addEventListener("input", event => {
            const query = event.target.value.trim();

            clearTimeout(debounceTimer);

            if (activeController) {
                activeController.abort();
                activeController = null;
            }

            latestQuery = query;

            if (query.length < 2) {
                closeDropdown();
                dropdown.replaceChildren();
                return;
            }

            debounceTimer = setTimeout(() => {
                fetchLocationSuggestions(query);
            }, 300);
        });

        document.addEventListener("click", event => {
            if (!event.target.closest(".search-wrapper")) {
                closeDropdown();
            }
        });

        cityInput.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeDropdown();
            }
        });
    }

    // IMPORTANT:
    // Search button and Enter-key handlers are intentionally not added here.
    // The replacement app.js already registers them. Registering them again
    // can cause duplicate weather API requests.

    // ==========================================
    // 3. INITIALIZATION
    // ==========================================

    function initializeHistory() {
        renderRecentSearches();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeHistory,
            { once: true }
        );
    } else {
        initializeHistory();
    }
})();
