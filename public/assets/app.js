(() => {
  const auth = document.getElementById('auth');
  const username = document.getElementById('username'); // 复用为 tocken 输入框
  const password = document.getElementById('password'); // 可能不存在
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authMsg = document.getElementById('authMsg');
  const regBox = document.getElementById('regBox');
  const regResult = document.getElementById('regResult');
  const regToken = document.getElementById('regToken');
  const copyTokenBtn = document.getElementById('copyTokenBtn');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
  const regHint = document.getElementById('regHint');

  function showAuth(message = '') {
    auth.hidden = false;
    authMsg.textContent = message;
  }

  async function verifyToken() {
    const token = getToken();
    if (!token) return false;
    try {
      await api('/api/me');
      return true;
    } catch {
      clearToken();
      return false;
    }
  }

  const goMain = (t) => { window.location.href = `/${t}`; };

  function isValidTocken(t) { return /^[A-Za-z0-9]{12}$/.test(t); }

  async function doLogin() {
    const t = username.value.trim();
    if (!isValidTocken(t)) { authMsg.textContent = '请输入12位 tocken（字母/数字）'; return; }
    authMsg.textContent = '';
    goMain(t);
  }

  function randomTocken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const arr = crypto.getRandomValues(new Uint8Array(12));
    let out = '';
    for (let i = 0; i < arr.length; i++) out += chars[arr[i] % chars.length];
    return out;
  }

  async function doRegister() {
    const t = randomTocken();
    // 展示 tocken，并允许复制或进入
    regToken.textContent = t;
    if (regBox) regBox.hidden = true;
    if (regResult) regResult.hidden = false;
    username.value = t;
    authMsg.textContent = '';
    // 自动跳转计时（可选）
    let redirected = false;
    const timer = setTimeout(() => {
      if (!redirected) goMain(t);
    }, 10000);
    const doEnter = () => { redirected = true; clearTimeout(timer); goMain(t); };
    enterBtn?.addEventListener('click', doEnter, { once: true });
    backBtn?.addEventListener('click', () => {
      redirected = true; clearTimeout(timer);
      if (regResult) regResult.hidden = true;
      if (regBox) regBox.hidden = false;
      regHint.textContent = '';
    }, { once: true });
    // 复制按钮：带降级方案
    const copyText = async (text) => {
      // 优先使用异步 Clipboard API（仅安全上下文 https 或 localhost 可用）
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); return true; } catch {}
      }
      // 降级：创建临时 textarea + execCommand('copy')
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.left = '-1000px';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return !!ok;
      } catch {
        return false;
      }
    };
    // 先移除旧监听，避免多次注册
    copyTokenBtn?.replaceWith(copyTokenBtn.cloneNode(true));
    const newCopyBtn = document.getElementById('copyTokenBtn');
    newCopyBtn?.addEventListener('click', async () => {
      const text = (regToken?.textContent || '').trim();
      if (!text) { regHint.textContent = '无可复制的 tocken'; return; }
      const ok = await copyText(text);
      regHint.textContent = ok ? '已复制到剪贴板，可粘贴保存' : '复制失败，请手动选择复制';
    });
  }

  loginBtn.addEventListener('click', doLogin);
  registerBtn.addEventListener('click', doRegister);
  username.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  // Init
  (async () => {
    showAuth('输入 12 位 tocken 登录，或点击注册生成');
    // 隐藏密码输入框（不再使用）
    if (password) password.style.display = 'none';
  })();
})();
