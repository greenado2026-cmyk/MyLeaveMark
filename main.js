const backendUrl = "https://твій-бекенд.onrender.com"; // або Vercel

const map = L.map('map').setView([55.1694, 23.8813], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

async function loadPoints() {
  const res = await fetch(`${backendUrl}/api/get-marks`);
  const points = await res.json();
  points.forEach(p => {
    L.marker([p.lat, p.lng]).addTo(map).bindPopup(`<b>${p.nickname}</b><br>${p.message || ""}`);
  });
}
loadPoints();

document.getElementById('markerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = document.getElementById('username').value;
  const message = document.getElementById('message').value;
  const captchaChecked = document.getElementById('captcha').checked;

  if (!captchaChecked) return alert('Підтвердіть, що ви не робот!');
  if (!navigator.geolocation) return alert('Браузер не підтримує геолокацію.');

  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const res = await fetch(`${backendUrl}/api/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, message, lat, lng, visibility: 'public' })
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert('Помилка створення платежу: ' + (data.error || 'невідома'));
  }, () => alert('Не вдалося визначити геолокацію.'));
});
