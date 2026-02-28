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

const API_BASE = location.port && location.port !== '3000' ? 'http://localhost:3000' : '';

let currentCertId;
let currentMobile;
let currentRequestId;

function showScreen(id) {
  document.querySelectorAll('.screen,#mainMenu').forEach((element) => (element.style.display = 'none'));
  document.getElementById('numPad').style.display = 'none';
  document.activeElement.blur();
  if (id) document.getElementById(id).style.display = 'block';
  if (id !== 'otpScreen') {
    currentRequestId = null;
    try {
      sessionStorage.removeItem('currentRequestId');
    } catch (error) {
      console.error(error);
    }
  }
}

document.getElementById('btnCert').onclick = () => showScreen('certScreen');
document.getElementById('btnComp').onclick = () => showScreen('compScreen');
document.getElementById('certBack').onclick = () => showScreen('mainMenu');
document.getElementById('compCancel').onclick = () => showScreen('mainMenu');
document.getElementById('otpCancel').onclick = () => showScreen('mainMenu');

async function runCertCheck() {
  const app = document.getElementById('certAppId').value.trim();
  const name = document.getElementById('certName').value.trim();
  const father = document.getElementById('certFName').value.trim();
  const dob = document.getElementById('certDob').value;
  if (!app && !(name && father && dob)) return alert('Enter details');

  const payload = app ? { application_id: app } : { name, father_name: father, dob };
  const res = await fetch(API_BASE + '/api/certificates/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (!data.found) {
    document.getElementById('certResult').textContent = 'Record not found.';
    return;
  }
  if (data.status !== 'ready') {
    document.getElementById('certResult').textContent = 'Certificate not ready yet.';
    return;
  }

  currentCertId = data.certificate_id;
  currentMobile = data.mobile_mask;
  document.getElementById('certResult').textContent = 'Ready. Sending OTP to ' + currentMobile + '...';

  const otpResponse = await fetch(API_BASE + '/api/certificates/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ certificate_id: currentCertId, mobile: currentMobile })
  });
  const otpData = await otpResponse.json();

  if (otpResponse.ok) {
    currentRequestId = otpData.request_id;
    try {
      sessionStorage.setItem('currentRequestId', String(otpData.request_id));
    } catch (error) {
      console.error(error);
    }

    document.getElementById('otpInput').value = '';
    const otpMsg = `OTP has been sent to ${currentMobile}. Demo OTP: <strong>${otpData.otp}</strong> (Expires in ${otpData.expires_in_minutes} minutes)`;
    document.getElementById('certResult').textContent = 'OTP has been sent to your registered mobile number.';
    console.log(`📱 DEMO OTP: ${otpData.otp} (Request ID: ${otpData.request_id})`);
    showScreen('otpScreen');
    document.getElementById('codeResult').innerHTML = otpMsg;
  } else {
    document.getElementById('certResult').textContent = 'Failed to send OTP. Please try again.';
  }
}

document.getElementById('certCheck').onclick = runCertCheck;
document.getElementById('certForm').addEventListener('submit', (event) => {
  event.preventDefault();
  runCertCheck();
});

['certAppId', 'certName', 'certFName', 'certDob'].forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') runCertCheck();
    });
    element.addEventListener('focus', () => showPad(element));
  }
});

document.querySelectorAll('input').forEach((input) => {
  input.addEventListener('focus', () => showPad(input));
});

const otpInput = document.getElementById('otpInput');
document.querySelectorAll('#otpScreen .num-pad button').forEach((button) => {
  button.onclick = () => {
    const value = button.textContent;
    if (value === 'C') otpInput.value = '';
    else if (value === '·') otpInput.value = otpInput.value.slice(0, -1);
    else otpInput.value += value;
  };
});

document.getElementById('otpClear').onclick = () => {
  otpInput.value = '';
};

document.getElementById('otpBack').onclick = () => {
  otpInput.value = otpInput.value.slice(0, -1);
};

document.getElementById('otpCancel').onclick = () => showScreen('mainMenu');

document.getElementById('otpSubmit').onclick = async () => {
  const otp = otpInput.value.trim();
  if (!otp) return alert('Enter OTP');

  if (!currentRequestId) {
    try {
      const stored = sessionStorage.getItem('currentRequestId');
      if (stored) currentRequestId = String(stored);
    } catch (error) {
      console.error(error);
    }
  }

  if (!currentRequestId) {
    alert('No request ID – please go back and check details again');
    return;
  }

  const resultDiv = document.getElementById('codeResult');
  resultDiv.textContent = 'Verifying...';

  try {
    const response = await fetch(API_BASE + '/api/certificates/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: currentRequestId, otp })
    });
    const data = await response.json();

    if (data.success) {
      resultDiv.textContent = 'Retrieval code: ' + data.code;
      alert('Link successfully sent to your registered mobile number');
      try {
        sessionStorage.removeItem('currentRequestId');
      } catch (error) {
        console.error(error);
      }
      currentRequestId = null;
    } else {
      let message = data.error || 'Unknown error';
      if (message === 'invalid otp') message = 'Invalid OTP. Please try again.';
      else if (message === 'expired') message = 'OTP expired. Request a new OTP.';
      else if (message === 'used') message = 'This OTP has already been used.';
      else if (message === 'not found') message = 'Request not found. Please re-check details.';
      else if (message === 'missing') message = 'Missing data. Please request OTP again.';
      resultDiv.textContent = 'Error: ' + message;
    }
  } catch (error) {
    resultDiv.textContent = 'Error: unable to reach server';
  }
};

const pad = document.getElementById('numPad');
function showPad(field) {
  if (field.id === 'otpInput') return;
  pad.style.display = 'grid';
  pad.currentField = field;
}

document.getElementById('padClear').onclick = () => {
  pad.currentField.value = '';
};

document.getElementById('padBack').onclick = () => {
  pad.currentField.value = pad.currentField.value.slice(0, -1);
};

document.querySelectorAll('#numPad button').forEach((button) => {
  button.onclick = () => {
    if (button.id === 'padClear' || button.id === 'padBack') return;
    if (pad.currentField) pad.currentField.value += button.textContent;
  };
});

async function submitComplaint() {
  const name = document.getElementById('compName').value.trim();
  const mobile = document.getElementById('compMobile').value.trim();
  const ward = document.getElementById('compWard').value.trim();
  const area = document.getElementById('compWard').value.trim();
  const landmark = document.getElementById('compLand').value.trim();
  const category = document.getElementById('compCat').value;
  const description = document.getElementById('compDesc').value.trim();

  if (!name || !mobile || !ward || !category) return alert('Fill required fields');

  const response = await fetch(API_BASE + '/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mobile, ward, area, landmark, category, description })
  });
  const data = await response.json();

  if (data.complaint_id) {
    const message = 'Complaint submitted – ID: ' + data.complaint_id;
    document.getElementById('compResult').textContent = message;
    alert(message);
    document.getElementById('compForm').reset();
  } else {
    document.getElementById('compResult').textContent = 'Error: ' + (data.error || '');
  }
}

document.getElementById('compSubmit').onclick = submitComplaint;
document.getElementById('compForm').addEventListener('submit', (event) => {
  event.preventDefault();
  submitComplaint();
});

['compName', 'compMobile', 'compWard', 'compLand', 'compCat', 'compDesc'].forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submitComplaint();
    });
  }
});
