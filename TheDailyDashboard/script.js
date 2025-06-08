const API_KEYS = {
    weather: '8ee00e986f830bcba3e74fa3eabf4136',
    // HIER IHREN GNEWS API SCHLÜSSEL EINTRAGEN
    gnews: '99617fa5db48e495eac4ef1347087873',
    nasa: 'rir8UjjxtiRwSlrnPtvyyjlUHC7yWNTAtzHewg4v'
};

const spinner = '<div class="spinner"><i class="fas fa-sync-alt fa-spin"></i></div>';

const weatherSection = document.getElementById('weather');
const weatherContent = document.getElementById('weather-content');
const newsContent = document.getElementById('news-content');
const apodSection = document.getElementById('apod');
const apodContent = document.getElementById('apod-content');
const clockElement = document.getElementById('live-clock');

// --- Live-Uhr ---
function updateClock() {
    const now = new Date();
    const date = now.toLocaleDateString('de-CH');
    const time = now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    clockElement.textContent = `${date}, ${time} Uhr`;
}

// --- Wetter-Logik mit Suche ---
async function fetchWeather(city) {
    weatherContent.innerHTML = spinner;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEYS.weather}&units=metric&lang=de`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if(response.status === 404) {
                throw new Error('Stadt nicht gefunden');
            }
            throw new Error('Netzwerkfehler');
        }
        const data = await response.json();

        // Hintergrund basierend auf dem Wetter ändern
        const weatherCondition = data.weather[0].main.toLowerCase();
        weatherSection.className = 'fullscreen-section'; // Reset classes
        if (weatherCondition.includes('clear')) weatherSection.classList.add('clear-sky');
        else if (weatherCondition.includes('clouds')) weatherSection.classList.add('clouds');
        else if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) weatherSection.classList.add('rain');
        else weatherSection.classList.add('default');

        weatherContent.innerHTML = `
            <div>
                <h1 class="weather-location">${data.name}, ${data.sys.country}</h1>
                <div class="weather-temp">${Math.round(data.main.temp)}°</div>
                <p class="weather-description">${data.weather[0].description}</p>
            </div>
            <div class="weather-search">
                <input type="text" id="city-input" placeholder="Andere Stadt suchen...">
                <button id="search-btn">Suchen</button>
            </div>
        `;

        // Event Listeners für die neue Suche hinzufügen
        document.getElementById('search-btn').addEventListener('click', () => {
            const newCity = document.getElementById('city-input').value;
            if (newCity) fetchWeather(newCity);
        });
        document.getElementById('city-input').addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const newCity = document.getElementById('city-input').value;
                if (newCity) fetchWeather(newCity);
            }
        });

    } catch (e) {
        weatherContent.innerHTML = `<h1>${e.message || 'Wetter nicht verfügbar'}</h1>
         <div class="weather-search">
            <input type="text" id="city-input" placeholder="Stadt erneut versuchen...">
            <button id="search-btn">Suchen</button>
        </div>`;
        // Event Listeners auch im Fehlerfall hinzufügen, um eine neue Suche zu ermöglichen
        document.getElementById('search-btn').addEventListener('click', () => {
            const newCity = document.getElementById('city-input').value;
            if (newCity) fetchWeather(newCity);
        });
        document.getElementById('city-input').addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const newCity = document.getElementById('city-input').value;
                if (newCity) fetchWeather(newCity);
            }
        });
    }
}

// --- Nachrichten-Logik (AKTUALISIERT FÜR GNEWS) ---
async function fetchNews() {
    newsContent.innerHTML = spinner;
    if (!API_KEYS.gnews || API_KEYS.gnews === 'IHR_GNEWS_API_SCHLÜSSEL') {
        newsContent.innerHTML = `<h2>Bitte gültigen GNews API-Schlüssel eintragen.</h2>`;
        return;
    }

    const url = `https://gnews.io/api/v4/search?q=Schweiz&lang=de&country=ch&max=10&token=${API_KEYS.gnews}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Nachrichten konnten nicht geladen werden.');

        const data = await response.json();
        let articlesHTML = '<h2 class="news-title">Aktuelle Meldungen</h2><div class="news-ticker">';
        data.articles.forEach(article => {
            articlesHTML += `
                <div class="news-item">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        <h3>${article.title}</h3>
                        <p class="news-meta">${article.source.name}</p>
                    </a>
                </div>`;
        });
        articlesHTML += '</div>';
        newsContent.innerHTML = articlesHTML;
    } catch (e) {
        console.error(e);
        newsContent.innerHTML = `<h2>Nachrichten nicht verfügbar</h2>`;
    }
}


// --- NASA-Logik mit Hintergrundbild ---
async function fetchApod() {
    apodContent.innerHTML = spinner;
    const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEYS.nasa}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = await response.json();

        apodSection.style.backgroundImage = `url(${data.hdurl || data.url})`;

        apodContent.innerHTML = `
            <div class="apod-overlay">
                <h1 class="apod-title">${data.title}</h1>
                <p class="apod-explanation">${data.explanation.substring(0, 200)}...</p>
            </div>
        `;
    } catch (e) {
        apodContent.innerHTML = `<h1>Bild des Tages nicht verfügbar</h1>`;
    }
}

// --- Navigations-Logik ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.fullscreen-section');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.section === entry.target.id);
            });
        }
    });
}, { threshold: 0.7 });

sections.forEach(section => observer.observe(section));

// Initiales Laden
fetchWeather('Zürich');
fetchNews();
fetchApod();
setInterval(updateClock, 1000);
updateClock();