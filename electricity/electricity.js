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

function showScreen(id) {
  document.querySelectorAll('.screen, #mainMenu').forEach((element) => (element.style.display = 'none'));
  document.getElementById(id).style.display = 'block';
  resetTimer();
}

document.getElementById('btnPay').addEventListener('click', () => showScreen('payScreen'));
document.getElementById('btnComplaint').addEventListener('click', () => showScreen('complaintScreen'));
document.getElementById('btnConnection').addEventListener('click', () => showScreen('connectionScreen'));
document.getElementById('btnEmergency').addEventListener('click', () => showScreen('emergencyScreen'));

const billInput = document.getElementById('billNumberInput');
document.querySelectorAll('#payScreen .num-pad button').forEach((button) => {
  button.addEventListener('click', () => {
    const value = button.textContent;
    if (value === 'C') {
      billInput.value = '';
    } else if (value === '←') {
      billInput.value = billInput.value.slice(0, -1);
    } else {
      billInput.value += value;
    }
  });
});

document.getElementById('submitBill').onclick = () => {
  if (!billInput.value) return alert('Enter bill number');
  const details = `<p>Consumer Name: John Doe</p><p>Address: 123 Main St</p>
      <p>Due Amount: ₹1500</p><p>Due Date: 28/02/2026</p>
      <p>Last 6 bills: Jan ₹1200, Dec ₹1100, Nov ₹1300, Oct ₹1250, Sep ₹1150, Aug ₹1000</p>`;
  document.getElementById('detailsArea').innerHTML = details;
  showScreen('billDetails');
};

document.getElementById('cancelPay').onclick = () => showScreen('mainMenu');
document.getElementById('backToPay').onclick = () => showScreen('payScreen');
document.getElementById('proceedPayment').onclick = () => showScreen('paymentOptions');
document.getElementById('optQR').onclick = () => alert('Showing QR code...');
document.getElementById('optCard').onclick = () => alert('Proceed to card entry (not implemented)');
document.getElementById('optAeps').onclick = () => alert('AEPS biometric flow');
document.getElementById('cancelPayment').onclick = () => showScreen('mainMenu');

document.getElementById('submitComplaint').onclick = () => {
  const complaintId = 'CMP' + Math.floor(Math.random() * 900000 + 100000);
  alert('Complaint registered\nID: ' + complaintId + '\nReceipt will be printed');
  showScreen('mainMenu');
};
document.getElementById('cancelComplaint').onclick = () => showScreen('mainMenu');

function openConnForm(title) {
  document.getElementById('connTitle').textContent = title;
  showScreen('connForm');
}

document.getElementById('connNew').onclick = () => openConnForm('New Connection');
document.getElementById('connMeter').onclick = () => openConnForm('New Meter Installation');
document.getElementById('connDiscon').onclick = () => openConnForm('Disconnection Request');
document.getElementById('cancelConnection').onclick = () => showScreen('mainMenu');
document.getElementById('backConn').onclick = () => showScreen('connectionScreen');
document.getElementById('submitConn').onclick = () => {
  alert('Request submitted');
  showScreen('mainMenu');
};

document.getElementById('emLiveWire').onclick = () => showScreen('emConfirm');
document.getElementById('emOutage').onclick = () => showScreen('emConfirm');
document.getElementById('cancelEmergency').onclick = () => showScreen('mainMenu');
document.getElementById('backFromEm').onclick = () => showScreen('mainMenu');

let idleTimer;
function resetTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => showScreen('mainMenu'), 60000);
}

['click', 'touchstart'].forEach((eventName) => document.addEventListener(eventName, resetTimer));
resetTimer();
showScreen('mainMenu');
