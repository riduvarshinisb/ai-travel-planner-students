// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const isDark = localStorage.getItem('darkMode') !== 'false';
body.classList.toggle('light-mode', !isDark);
themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
themeToggle.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  const dark = !body.classList.contains('light-mode');
  localStorage.setItem('darkMode', dark);
  themeToggle.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Form handling
const form = document.getElementById('tripForm');
const formSection = document.getElementById('formSection');
const itinerarySection = document.getElementById('itinerarySection');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const destination = document.getElementById('destination').value;
  const days = document.getElementById('days').value;
  const budget = document.getElementById('budget').value;
  const interests = document.getElementById('interests').value || 'general';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, days, budget, interests })
    });
    const data = await response.json();
    displayItinerary(data);
    formSection.classList.add('hidden');
    itinerarySection.classList.remove('hidden');
  } catch (error) {
    alert('Error generating itinerary. Check console.');
    console.error(error);
  }
});

// Display itinerary
function displayItinerary(data) {
  document.getElementById('tripTitle').textContent = `${data.title}`;
  const content = document.getElementById('itineraryContent');
  content.innerHTML = data.itinerary.map(day => `
    <div class="day-card">
      <h3>Day ${day.day}: ${day.title}</h3>
      <ul>${day.activities.map(act => `<li>${act} ($${day.costs[act] || 'Free'})</li>`).join('')}</ul>
      <p class="cost">Daily Total: $${day.totalCost} | Tips: ${day.tips}</p>
    </div>
  `).join('');
  initMap(data.locations);
  setupExport(data);
}

let map;
function initMap(locations) {
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.style.display = 'block';
  map = L.map('map').setView([locations[0]?.lat || 51.505, locations[0]?.lng || -0.09], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  locations.forEach(loc => {
    if (loc.lat && loc.lng) {
      L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(loc.name);
    }
  });
  // Add polyline for route if multiple points
  if (locations.length > 1) {
    const path = locations.map(loc => [loc.lat, loc.lng]);
    L.polyline(path, { color: '#f97316' }).addTo(map);
  }
}

// Export PDF
function setupExport(data) {
  document.getElementById('exportBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(data.title, 20, 20);
    let y = 30;
    data.itinerary.forEach(day => {
      doc.setFontSize(12);
      doc.text(`Day ${day.day}: ${day.title}`, 20, y);
      y += 10;
      day.activities.forEach(act => {
        doc.text(`- ${act} ($${day.costs[act] || 'Free'})`, 25, y);
        y += 7;
      });
      doc.text(`Total: $${day.totalCost} | Tips: ${day.tips}`, 25, y);
      y += 15;
    });
    doc.save(`${data.title.replace(/\s+/g, '_')}.pdf`);
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    const url = `${window.location.origin}?dest=${encodeURIComponent(data.title)}`;
    navigator.clipboard.writeText(url).then(() => alert('Share link copied!'));
  });
}

// Load map in container
const mapContainer = document.getElementById('mapContainer');
const mapDiv = document.createElement('div');
mapDiv.id = 'map';
mapContainer.appendChild(mapDiv);
