// ==========================================
// 1. RECENT SEARCHES & HISTORY MANAGEMENT
// ==========================================
let recentSearches = JSON.parse(localStorage.getItem('atmos_recent_searches')) || ['Delhi', 'Mumbai', 'Bengaluru'];

function renderRecentSearches() {
    const container = document.getElementById('recent-chips');
    if (!container) return;

    container.innerHTML = '';

    if (recentSearches.length === 0) {
        container.innerHTML = '<span style="color: var(--text-grey); font-size: 11px;">No recent searches</span>';
        return;
    }

    recentSearches.forEach((city) => {
        const chip = document.createElement('div');
        chip.className = 'chip';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chip-name';
        nameSpan.textContent = city;
        nameSpan.addEventListener('click', () => {
            const cityInput = document.getElementById('city-input');
            if (cityInput) cityInput.value = city;
            
            if (typeof fetchWeatherByCity === 'function') {
                fetchWeatherByCity(city);
            } else {
                const searchBtn = document.getElementById('search-btn');
                if (searchBtn) searchBtn.click();
            }
        });

        // Delete button for individual chip
        const removeBtn = document.createElement('button');
        removeBtn.className = 'chip-remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = `Remove ${city}`;
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeRecentSearch(city);
        });

        chip.appendChild(nameSpan);
        chip.appendChild(removeBtn);
        container.appendChild(chip);
    });

    // Clear All History Button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-history-btn';
    clearBtn.textContent = 'Clear All';
    clearBtn.addEventListener('click', clearAllSearches);
    container.appendChild(clearBtn);
}

function addRecentSearch(cityName) {
    if (!cityName || !cityName.trim()) return;
    const cleanName = cityName.trim();
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== cleanName.toLowerCase());
    recentSearches.unshift(cleanName);
    if (recentSearches.length > 6) recentSearches.pop();
    localStorage.setItem('atmos_recent_searches', JSON.stringify(recentSearches));
    renderRecentSearches();
}

function removeRecentSearch(cityName) {
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== cityName.toLowerCase());
    localStorage.setItem('atmos_recent_searches', JSON.stringify(recentSearches));
    renderRecentSearches();
}

function clearAllSearches() {
    recentSearches = [];
    localStorage.removeItem('atmos_recent_searches');
    renderRecentSearches();
}

// ==========================================
// 2. LIVE AUTOCOMPLETE DROPDOWN (Geocoding API)
// ==========================================
const cityInput = document.getElementById('city-input');
const searchDropdown = document.getElementById('search-dropdown');
const searchBtn = document.getElementById('search-btn');
let debounceTimer;

if (cityInput && searchDropdown) {
    cityInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 2) {
            searchDropdown.classList.remove('show');
            searchDropdown.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchLocationSuggestions(query);
        }, 280);
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchDropdown.classList.remove('show');
            const val = cityInput.value.trim();
            if (val) {
                addRecentSearch(val);
                if (typeof fetchWeatherByCity === 'function') {
                    fetchWeatherByCity(val);
                } else if (searchBtn) {
                    searchBtn.click();
                }
            }
        }
    });
}

async function fetchLocationSuggestions(query) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
        const data = await response.json();

        searchDropdown.innerHTML = '';

        if (!data.results || data.results.length === 0) {
            searchDropdown.innerHTML = `
                <div class="dropdown-item" style="cursor: default;">
                    <span class="item-main">No locations found</span>
                </div>
            `;
            searchDropdown.classList.add('show');
            return;
        }

        data.results.forEach((loc) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';

            const districtState = [loc.admin2, loc.admin1].filter(Boolean).join(', ');
            const subLabel = [districtState, loc.country].filter(Boolean).join(', ');

            item.innerHTML = `
                <span class="item-main">${loc.name}</span>
                <span class="item-sub">${subLabel}</span>
            `;

            item.addEventListener('click', () => {
                cityInput.value = loc.name;
                searchDropdown.classList.remove('show');
                addRecentSearch(loc.name);

                // Check and trigger coordinate or city weather function
                if (typeof fetchWeatherByCoords === 'function') {
                    fetchWeatherByCoords(loc.latitude, loc.longitude, loc.name, subLabel);
                } else if (typeof fetchWeatherByCity === 'function') {
                    fetchWeatherByCity(loc.name);
                } else if (searchBtn) {
                    searchBtn.click();
                }
            });

            searchDropdown.appendChild(item);
        });

        searchDropdown.classList.add('show');
    } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
    }
}

// Close dropdown when clicked outside
document.addEventListener('click', (e) => {
    if (searchDropdown && !e.target.closest('.search-wrapper')) {
        searchDropdown.classList.remove('show');
    }
});

// Search button click handler
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const val = cityInput.value.trim();
        if (val) {
            addRecentSearch(val);
            if (typeof fetchWeatherByCity === 'function') {
                fetchWeatherByCity(val);
            }
        }
    });
}

// ==========================================
// 3. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderRecentSearches();
});
