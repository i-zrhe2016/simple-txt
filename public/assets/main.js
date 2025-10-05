(() => {
  const editor = document.getElementById('editor');
  function getTockenFromPath() {
    const seg = (location.pathname || '/').slice(1).split('/')[0];
    return /^[A-Za-z0-9]{12}$/.test(seg) ? seg : '';
  }
  const TOCKEN = getTockenFromPath();

  const api = async (path, opts = {}) => {
    const headers = Object.assign({ 'content-type': 'application/json' }, opts.headers || {});
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const msg = body && body.error ? body.error : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return body;
  };

  function ensureTocken() {
    if (!TOCKEN) { window.location.replace('/'); return false; }
    return true;
  }

  async function loadNote() {
    try {
      const r = await api(`/api/note/${TOCKEN}`);
      editor.value = r?.content || '';
    } catch {
      editor.value = '';
    }
  }

  const debounced = (fn, ms = 400) => { let t=null; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
  const saveNote = debounced(async () => {
    try {
      await api(`/api/note/${TOCKEN}`, { method: 'POST', body: JSON.stringify({ content: editor.value || '' }) });
    } catch (e) {
      console.error('保存失败:', e.message);
    }
  }, 400);

  editor.addEventListener('input', saveNote);

  (async () => {
    if (!ensureTocken()) return;
    await loadNote();
    editor.focus();
  })();
})();
