const mode = document.getElementById('mode');
const userFormat = document.getElementById('userFormat');
const inspectBtn = document.getElementById('inspect');
const downloadAllBtn = document.getElementById('downloadAll');
const results = document.getElementById('results');

mode.addEventListener('change', () => {
  userFormat.style.display = mode.value === 'choose' ? 'inline-block' : 'none';
});

function sanitizeName(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : u.hostname;
  } catch {
    return 'file';
  }
}

async function probeUrl(url) {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) return { ok: true, type: head.headers.get('content-type') || '' };
  } catch {}
  return { ok: false, type: '' };
}

function suggestFormats(mime) {
  if (!mime) return ['application/octet-stream'];
  if (mime.startsWith('image/')) return ['image/png','image/jpeg','image/webp'];
  if (mime.startsWith('text/')) return ['text/plain','application/json'];
  return [mime];
}

inspectBtn.addEventListener('click', async () => {
  results.innerHTML = '';
  const lines = document.getElementById('urls').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!lines.length) return results.innerHTML = '<p>Pega al menos un enlace.</p>';
  for (const u of lines) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<b>${sanitizeName(u)}</b><br><small>${u}</small><br><i>Analizando...</i>`;
    results.appendChild(div);
    const info = await probeUrl(u);
    const suggested = suggestFormats(info.type);
    div.innerHTML = `<b>${sanitizeName(u)}</b><br><small>${u}</small><br>
      Tipo: ${info.type || 'desconocido'}<br>
      <select>${suggested.map(s => `<option>${s}</option>`).join('')}</select>
      <button class='dl'>Descargar</button>`;
    div.querySelector('.dl').addEventListener('click', async () => {
      const sel = div.querySelector('select').value;
      await downloadFile(u, sel);
    });
  }
});

async function downloadFile(url, mime) {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const name = sanitizeName(url);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
