// /script.js - frontend behavior: form, map, fetch, export
const form = document.getElementById("trip-form");
const destInput = document.getElementById("destination");
const daysInput = document.getElementById("days");
const budgetInput = document.getElementById("budget");
const interestsInput = document.getElementById("interests");
const transportInput = document.getElementById("transport");
const generateBtn = document.getElementById("generate");
const itineraryContainer = document.getElementById("itineraryContainer");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");
const modeToggle = document.getElementById("modeToggle");

let latestItinerary = null;

// dark/light toggle
function applyMode(mode){
  document.body.className = mode;
  modeToggle.textContent = mode === "dark" ? "Light" : "Dark";
  localStorage.setItem("mode", mode);
}
modeToggle.addEventListener("click", ()=> applyMode(document.body.classList.contains("dark") ? "light" : "dark"));
applyMode(localStorage.getItem("mode") || "dark");

// Leaflet map
let map = L.map('map', {zoomControl:true, scrollWheelZoom:false}).setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);
let destMarker = null;

async function geocodeAndCenter(q) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
    const data = await r.json();
    if (data && data[0]) {
      const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
      map.setView([lat, lon], 12);
      if (destMarker) destMarker.remove();
      destMarker = L.marker([lat, lon]).addTo(map).bindPopup(q).openPopup();
    } else {
      map.setView([20,0],3);
      if (destMarker) destMarker.remove();
    }
  } catch (e) {
    console.warn("Geocode failed", e);
  }
}

function showLoading(on=true){
  generateBtn.disabled = on;
  generateBtn.textContent = on ? "Generating…" : "Generate itinerary";
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const destination = destInput.value.trim();
  const days = Number(daysInput.value);
  const budget = budgetInput.value.trim();
  const interests = interestsInput.value.trim();
  const transport = transportInput.value;

  if (!destination || !days || !budget) return alert("Please fill destination, days and budget.");

  showLoading(true);
  itineraryContainer.innerHTML = `<p class="meta">Asking Gemini for a short student itinerary…</p>`;
  await geocodeAndCenter(destination);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ destination, days, budget, interests, transport })
    });
    const data = await res.json();
    if (!data || !data.success) {
      itineraryContainer.innerHTML = `<pre class="meta">Error: ${data?.error || "no response"}</pre>`;
      return;
    }

    // prefer parsed JSON returned from server; otherwise try to parse
    let it = data.itinerary;
    if (!it && data.raw) {
      try { it = JSON.parse(data.raw); } catch {}
    }
    latestItinerary = it ?? { raw: data.raw };

    renderItinerary(latestItinerary);
    downloadBtn.disabled = false;
    copyBtn.disabled = false;
  } catch (err) {
    itineraryContainer.innerHTML = `<pre class="meta">Request error: ${err.message}</pre>`;
  } finally {
    showLoading(false);
  }
});

function renderItinerary(it) {
  if (!it) { itineraryContainer.innerHTML = "<p class='meta'>No itinerary returned.</p>"; return; }

  if (it.raw && !it.days) {
    itineraryContainer.innerHTML = `<pre class="meta">${escapeHtml(it.raw)}</pre>`;
    return;
  }

  // Structured view
  const title = it.title || `${it.destination} trip`;
  const total = it.total_estimated_cost || "";
  let html = `<div class="meta"><strong>${escapeHtml(title)}</strong> — ${escapeHtml(it.destination || "")} ${total ? `• ${escapeHtml(total)}` : ""}</div>`;
  if (Array.isArray(it.days)) {
    for (const day of it.days) {
      html += `<div class="day-card"><div>
                <h4>Day ${escapeHtml(String(day.day || ""))}</h4>
                <div class="meta">${escapeHtml(day.summary || "")}</div>
                <ul>`;
      if (Array.isArray(day.activities)) {
        for (const a of day.activities) {
          html += `<li>${escapeHtml(a.time || "")} — ${escapeHtml(a.activity || "")} ${a.est_cost ? `<span class="meta">(${escapeHtml(a.est_cost)})</span>`: ""}</li>`;
        }
      }
      html += `</ul></div><div class="meta">${escapeHtml(day.daily_cost || "")}</div></div>`;
    }
  }

  if (Array.isArray(it.recommended_hostels) && it.recommended_hostels.length) {
    html += `<div class="meta"><strong>Hostel picks</strong><ul>`;
    for (const h of it.recommended_hostels) {
      html += `<li>${escapeHtml(h.name||"")} — ${escapeHtml(h.approx_price||"")} ${h.note ? `• ${escapeHtml(h.note)}`:""}</li>`;
    }
    html += `</ul></div>`;
  }

  if (Array.isArray(it.transport_tips)) html += `<div class="meta"><strong>Transport tips</strong><ul>${it.transport_tips.map(t=>`<li>${escapeHtml(t)}</li>`).join("")}</ul></div>`;
  if (Array.isArray(it.money_saving_tips)) html += `<div class="meta"><strong>Money-saving tips</strong><ul>${it.money_saving_tips.map(t=>`<li>${escapeHtml(t)}</li>`).join("")}</ul></div>`;

  itineraryContainer.innerHTML = html;
}

function escapeHtml(s){
  return String(s || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// download & copy
downloadBtn.addEventListener("click", ()=>{
  if (!latestItinerary) return;
  const blob = new Blob([JSON.stringify(latestItinerary, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `itinerary-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
});

copyBtn.addEventListener("click", async ()=>{
  if (!latestItinerary) return;
  await navigator.clipboard.writeText(JSON.stringify(latestItinerary, null, 2));
  copyBtn.textContent = "Copied!";
  setTimeout(()=>copyBtn.textContent = "Copy", 1500);
});
