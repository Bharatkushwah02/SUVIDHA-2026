function updateClock() {
  const now = new Date();
  const opts = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  document.getElementById('dateTime').textContent = now.toLocaleString('en-GB', opts);
}

setInterval(updateClock, 1000);
updateClock();
