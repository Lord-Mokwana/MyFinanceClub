// app.js - wizard control, calculations, signature capture, files->base64, submit payload
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww6W3QusWGvFd9LxbvK2WAjEX2GAauqsliRkFKxg-IpUiRiJJubQcRqHp9lF0nkRYzQw/exec'; // replace
const SECRET_KEY = 'TshenoloMokwana0110305589084@lordMokwana'; // replace

// Simple helper
const $ = id => document.getElementById(id);
const stages = [1,2,3,4];
let currentStage = 1;

// Progress UI
function setStage(n){
  currentStage = n;
  stages.forEach(s => {
    const el = $(`stage${s}`);
    if(!el) return;
    if(s === n) el.classList.remove('hidden'); else el.classList.add('hidden');
    const stepbtn = document.querySelector(`.step[data-step="${s}"]`);
    if(stepbtn) stepbtn.classList.toggle('active', s <= n);
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

// wire stage buttons
document.addEventListener('DOMContentLoaded', ()=>{
  // stage ids exist as forms with ids stage1..stage4
  // attach continue/back buttons
  $('toStage2').onclick = ()=> {
    // validate basic fields
    if(!$('s1_name').value || !$('s1_employee').value || !$('s1_email').value || !$('s1_principal').value){
      showStatus('Please complete required fields in Stage 1', true); return;
    }
    // capture signature onto hidden session storage later
    saveStage1ToSession();
    setStage(2);
  };
  $('backTo1').onclick = ()=> setStage(1);
  $('toStage3').onclick = ()=> {
    // basic validation could be added; we calculate totals first
    calculateFinancials();
    saveStage2ToSession();
    setStage(3);
  };
  $('backTo2').onclick = ()=> setStage(2);
  $('toStage4').onclick = ()=> { saveStage3ToSession(); setStage(4); };
  $('backTo3').onclick = ()=> setStage(3);

  // start apply link
  document.getElementById('startApply').addEventListener('click', (e)=>{ e.preventDefault(); setStage(1); location.hash = '#apply'; });

  // signature canvas setup
  setupSignature();

  // file input list
  $('docs').addEventListener('change', handleFileList);

  // submit button
  $('submitApp').addEventListener('click', submitApplication);

  // initial stage 1 visible
  setStage(1);
});

// status
function showStatus(msg, isError=false){ const el = $('submitStatus'); el.textContent = msg; el.style.color = isError ? '#b91c1c' : '#0b2340'; }

// signature logic
function setupSignature(){
  const canvas = $('sig');
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
  let drawing=false, last={x:0,y:0};
  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const client = e.touches && e.touches[0] ? e.touches[0] : e;
    return {x: client.clientX - rect.left, y: client.clientY - rect.top};
  }
  canvas.addEventListener('mousedown',(e)=>{ drawing=true; last = getPos(e); });
  canvas.addEventListener('touchstart',(e)=>{ drawing=true; last = getPos(e); });
  window.addEventListener('mouseup',()=>drawing=false);
  canvas.addEventListener('mousemove',(e)=>{ if(!drawing) return; const p=getPos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; });
  canvas.addEventListener('touchmove',(e)=>{ if(!drawing) return; const p=getPos(e.touches[0]); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; });
  $('clearSig').addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); });
}

// save stage1
function saveStage1ToSession(){
  const canvas = $('sig');
  const blank = document.createElement('canvas'); blank.width=canvas.width; blank.height=canvas.height;
  let sigData = '';
  if(canvas.toDataURL() !== blank.toDataURL()){
    sigData = canvas.toDataURL('image/png');
  } else if($('s1_typedSignature').value.trim()){
    sigData = 'data:text/plain,' + encodeURIComponent($('s1_typedSignature').value.trim());
  }
  const s1 = {
    name: $('s1_name').value.trim(),
    employee: $('s1_employee').value.trim(),
    email: $('s1_email').value.trim(),
    phone: $('s1_phone').value.trim(),
    principal: $('s1_principal').value.trim(),
    interest: $('s1_interest').value.trim(),
    dueDate: $('s1_due').value,
    signature: sigData
  };
  sessionStorage.setItem('mfc_stage1', JSON.stringify(s1));
}

// calc and save stage2
function calculateFinancials(){
  const inc = (parseFloat($('inc_basic').value||0) + parseFloat($('inc_allow').value||0) + parseFloat($('inc_other').value||0));
  const b1 = parseFloat($('exp_deductions').value||0);
  const b2 = parseFloat($('exp_debt').value||0);
  const b3 = parseFloat($('exp_living').value||0);
  const totalExpenses = b1 + b2 + b3;
  $('calc_income').textContent = `R ${inc.toFixed(2)}`;
  $('calc_expenses').textContent = `R ${totalExpenses.toFixed(2)}`;
  $('calc_net').textContent = `R ${(inc - b1).toFixed(2)}`;
  $('calc_surplus').textContent = `R ${(inc - totalExpenses).toFixed(2)}`;
}
function saveStage2ToSession(){
  const s2 = {
    inc_basic: $('inc_basic').value || '',
    inc_allow: $('inc_allow').value || '',
    inc_other: $('inc_other').value || '',
    exp_deductions: $('exp_deductions').value || '',
    exp_debt: $('exp_debt').value || '',
    exp_living: $('exp_living').value || ''
  };
  sessionStorage.setItem('mfc_stage2', JSON.stringify(s2));
}
function saveStage3ToSession(){
  const s3 = {
    bank_name: $('bank_name').value||'',
    bank_holder: $('bank_holder').value||'',
    bank_account: $('bank_account').value||'',
    bank_branch: $('bank_branch').value||'',
    bank_type: $('bank_type').value||''
  };
  sessionStorage.setItem('mfc_stage3', JSON.stringify(s3));
}

// files handling
let filesForUpload = [];
function handleFileList(e){
  filesForUpload = Array.from(e.target.files || []);
  const list = $('fileList');
  list.innerHTML = '';
  filesForUpload.forEach((f, i) => {
    const div = document.createElement('div'); div.textContent = `${f.name} (${(f.size/1024/1024).toFixed(2)} MB)`;
    list.appendChild(div);
  });
}

// convert files to base64
function filesToBase64(files){
  // returns Promise resolving to array of {name, mime, data (base64)}
  return Promise.all(files.map(file => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = ()=> {
      const dataUrl = reader.result;
      // strip prefix data:<mime>;base64,
      const parts = dataUrl.split(',');
      const meta = parts[0]; const b64 = parts[1];
      const mime = /data:([^;]+);/.exec(meta);
      res({ name: file.name, mime: mime ? mime[1] : 'application/octet-stream', data: b64 });
    };
    reader.onerror = err => rej(err);
    reader.readAsDataURL(file);
  })) );
}

// final submit
async function submitApplication(){
  showStatus('Preparing application...');
  // gather from session
  const s1 = JSON.parse(sessionStorage.getItem('mfc_stage1')||'{}');
  const s2 = JSON.parse(sessionStorage.getItem('mfc_stage2')||'{}');
  const s3 = JSON.parse(sessionStorage.getItem('mfc_stage3')||'{}');
  const lateFeeValue = $('lateFee').value || '';
  // convert files
  let filesPayload = [];
  try{
    filesPayload = await filesToBase64(filesForUpload);
  }catch(err){
    showStatus('Error reading files: ' + err, true); return;
  }
  const payload = {
    timestamp: new Date().toISOString(),
    borrowerName: s1.name || '',
    employeeNo: s1.employee || '',
    borrowerEmail: s1.email || '',
    borrowerPhone: s1.phone || '',
    principal: s1.principal || '',
    interestRate: s1.interest || '',
    dueDate: s1.dueDate || '',
    signature: s1.signature || '',
    financial: s2,
    banking: s3,
    lateFee: lateFeeValue,
    files: filesPayload,
    secret: SECRET_KEY
  };

  // POST
  showStatus('Submitting application...');
  try{
    const resp = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if(resp.ok && data.status === 'success'){
      showStatus('Application submitted successfully — you will receive a confirmation shortly.');
      sessionStorage.removeItem('mfc_stage1'); sessionStorage.removeItem('mfc_stage2'); sessionStorage.removeItem('mfc_stage3');
      filesForUpload = [];
      $('fileList').innerHTML = '';
      setTimeout(()=> setStage(1), 2000);
    } else {
      showStatus('Submission failed: ' + (data.message || JSON.stringify(data)), true);
    }
  }catch(err){
    showStatus('Network error: ' + err, true);
    console.error(err);
  }
}
