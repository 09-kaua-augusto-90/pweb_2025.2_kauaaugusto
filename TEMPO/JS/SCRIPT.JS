const weatherConfig = {
    0: { desc: "Céu Limpo", icon: "sun" },
    1: { desc: "Predom. Limpo", icon: "cloud-sun" },
    2: { desc: "Parcialmente Nublado", icon: "cloud" },
    3: { desc: "Encoberto", icon: "clouds" },
    45: { desc: "Nevoeiro", icon: "cloud-fog" },
    48: { desc: "Nevoeiro com Gelo", icon: "cloud-snow" },
    51: { desc: "Drizzle Leve", icon: "cloud-drizzle" },
    61: { desc: "Chuva Leve", icon: "cloud-rain" },
    63: { desc: "Chuva Moderada", icon: "cloud-rain" },
    71: { desc: "Neve Leve", icon: "cloud-snow" },
    80: { desc: "Pancadas de Chuva", icon: "cloud-showers-heavy" },
    95: { desc: "Trovoada", icon: "cloud-lightning" }
};

const input = document.querySelector("#city-input");
const btn = document.querySelector("#search-btn");
const display = document.querySelector("#weather-display");
const welcome = document.querySelector("#welcome-msg");

async function fetchWeather() {
    const city = input.value.trim();
    if (!city) return;

    setLoading(true);

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error("Cidade não localizada. Tente novamente.");

        const { latitude, longitude, name, admin1, country } = geoData.results[0];

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&timezone=auto`);
        const weatherData = await weatherRes.json();

        updateUI(name, admin1, country, weatherData.current);
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function updateUI(city, state, country, data) {
    const locationStr = state ? `${city}, ${state}` : `${city}, ${country}`;
    document.querySelector("#city-name").innerText = locationStr;
    
    document.querySelector("#date-now").innerText = new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', day: 'numeric', month: 'short' 
    });

    document.querySelector("#temp-value").innerText = Math.round(data.temperature_2m);
    document.querySelector("#humidity").innerText = `${data.relative_humidity_2m}%`;
    document.querySelector("#wind").innerText = `${Math.round(data.wind_speed_10m)} km/h`;
    document.querySelector("#feels-like").innerText = `${Math.round(data.apparent_temperature)}°`;
    document.querySelector("#visibility").innerText = `${(data.visibility / 1000).toFixed(1)} km`;

    const config = weatherConfig[data.weather_code] || { desc: "Condições Variáveis", icon: "cloud" };
    document.querySelector("#weather-desc").innerText = config.desc;
    
    const iconElement = document.querySelector("#weather-icon");
    iconElement.setAttribute("data-lucide", config.icon);
    lucide.createIcons();

    welcome.classList.add("hidden");
    display.classList.remove("hidden");
}

function setLoading(isLoading) {
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? "0.5" : "1";
    if (isLoading) {
        input.placeholder = "Buscando dados...";
    } else {
        input.placeholder = "Pesquisar cidade...";
    }
}

function showError(msg) {
    alert(msg);
}

btn.addEventListener("click", fetchWeather);
input.addEventListener("keypress", (e) => { if (e.key === "Enter") fetchWeather(); });

lucide.createIcons();