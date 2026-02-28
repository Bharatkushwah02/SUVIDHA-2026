function updateClock() {
  const date = new Date();
  const time = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ':' + date.getSeconds().toString().padStart(2, '0');
  const formattedDate = ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
  document.getElementById('dateTime').textContent = formattedDate + ' ' + time;
}
setInterval(updateClock, 1000);
updateClock();

let idleTimer;
function resetTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => showScreen('mainMenu'), 60000);
}

function showScreen(id) {
  document.querySelectorAll('.screen, #mainMenu').forEach((element) => (element.style.display = 'none'));
  if (id) document.getElementById(id).style.display = 'block';
  resetTimer();
}

document.getElementById('btnSelectPNG').onclick = () => showScreen('pngServiceMenu');
document.getElementById('btnSelectLPG').onclick = () => showScreen('lpgServiceMenu');
document.getElementById('backFromPngMenu').onclick = () => showScreen('mainMenu');
document.getElementById('backFromLpgMenu').onclick = () => showScreen('mainMenu');

document.getElementById('btnPngNew').onclick = () => showScreen('pngNewForm');
document.getElementById('btnPngBill').onclick = () => showScreen('pngBillScreen');
document.getElementById('btnPngMeter').onclick = () => {
  document.getElementById('pngCompTitle').textContent = 'Meter Issue';
  document.getElementById('pngCompType').value = 'Meter Issue';
  showScreen('pngComplaintForm');
};
document.getElementById('btnPngLeakage').onclick = () => {
  document.getElementById('pngCompTitle').textContent = 'Leakage Report';
  document.getElementById('pngCompType').value = 'Leakage';
  showScreen('pngComplaintForm');
};
document.getElementById('btnPngEmerg').onclick = () => showScreen('pngEmergScreen');
document.getElementById('btnPngRemove').onclick = () => showScreen('pngRemoveForm');

document.getElementById('btnLpgDelivery').onclick = () => showScreen('lpgDeliveryForm');
document.getElementById('btnLpgOvercharge').onclick = () => showScreen('lpgOverchargeForm');
document.getElementById('btnLpgDefect').onclick = () => showScreen('lpgDefectForm');
document.getElementById('btnLpgSafety').onclick = () => showScreen('lpgSafetyScreen');

document.getElementById('submitPngNew').onclick = () => {
  if (!document.getElementById('pngName').value) return alert('Enter name');
  const requestId = 'REQ' + Math.random().toString().slice(2, 8);
  document.getElementById('confirmMsg').textContent = 'Request ID: ' + requestId;
  showScreen('confirmScreen');
};
document.getElementById('cancelPngNew').onclick = () => showScreen('pngServiceMenu');

const pngInput = document.getElementById('pngConsInput');
document.querySelectorAll('#pngBillScreen .num-pad button').forEach((button) => {
  button.onclick = () => {
    const value = button.textContent;
    if (value === 'C') pngInput.value = '';
    else if (value === '·') pngInput.value = pngInput.value.slice(0, -1);
    else pngInput.value += value;
  };
});

document.getElementById('submitPngCons').onclick = () => {
  if (!pngInput.value) return alert('Enter ID');
  document.getElementById('pngBillArea').innerHTML = '<p>Amount: Rs.850</p><p>Status: Overdue</p>';
  showScreen('pngBillDetails');
};
document.getElementById('cancelPngBill').onclick = () => showScreen('pngServiceMenu');
document.getElementById('backPngDetails').onclick = () => showScreen('pngBillScreen');
document.getElementById('proceedPngPay').onclick = () => showScreen('pngPayOptions');

['pngQR', 'pngCard', 'pngAEPS'].forEach((id) => {
  document.getElementById(id).onclick = () => alert('Payment processing...');
});

document.getElementById('cancelPngPay').onclick = () => showScreen('pngServiceMenu');

document.getElementById('submitPngComp').onclick = () => {
  if (!document.getElementById('pngCompCons').value) return alert('Enter ID');
  const complaintId = 'CMP' + Math.random().toString().slice(2, 8);
  document.getElementById('confirmMsg').textContent = 'Complaint ID: ' + complaintId;
  showScreen('confirmScreen');
};
document.getElementById('cancelPngComp').onclick = () => showScreen('pngServiceMenu');

document.getElementById('submitPngEmerg').onclick = () => {
  document.getElementById('confirmMsg').textContent = 'Emergency reported. Help dispatching...';
  showScreen('confirmScreen');
};
document.getElementById('cancelPngEmerg').onclick = () => showScreen('pngServiceMenu');

document.getElementById('submitPngRemove').onclick = () => {
  if (!document.getElementById('pngRemoveId').value) return alert('Enter ID');
  const requestId = 'REQ' + Math.random().toString().slice(2, 8);
  document.getElementById('confirmMsg').textContent = 'Request ID: ' + requestId;
  showScreen('confirmScreen');
};
document.getElementById('cancelPngRemove').onclick = () => showScreen('pngServiceMenu');

document.getElementById('submitLpgDeliv').onclick = () => {
  if (!document.getElementById('lpgDeliv').value) return alert('Enter #');
  const complaintId = 'CMP' + Math.random().toString().slice(2, 8);
  document.getElementById('confirmMsg').textContent = 'Complaint ID: ' + complaintId;
  showScreen('confirmScreen');
};
document.getElementById('cancelLpgDeliv').onclick = () => showScreen('lpgServiceMenu');

document.getElementById('submitLpgOver').onclick = () => {
  if (!document.getElementById('lpgOverNum').value) return alert('Enter #');
  const complaintId = 'CMP' + Math.random().toString().slice(2, 8);
  document.getElementById('confirmMsg').textContent = 'Complaint ID: ' + complaintId;
  showScreen('confirmScreen');
};
document.getElementById('cancelLpgOver').onclick = () => showScreen('lpgServiceMenu');

document.getElementById('submitLpgDefect').onclick = () => {
  if (!document.getElementById('lpgDefectNum').value) return alert('Enter #');
  const reportId = 'REP' + Math.random().toString().slice(2, 8);
  document.getElementById('confirmMsg').textContent = 'Report ID: ' + reportId;
  showScreen('confirmScreen');
};
document.getElementById('cancelLpgDefect').onclick = () => showScreen('lpgServiceMenu');

document.getElementById('backFromSafety').onclick = () => showScreen('lpgServiceMenu');
document.getElementById('backFromConfirm').onclick = () => showScreen('mainMenu');

['click', 'touchstart'].forEach((eventName) => document.addEventListener(eventName, resetTimer));
resetTimer();
showScreen('mainMenu');
