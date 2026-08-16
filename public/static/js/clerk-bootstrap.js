const key = document.querySelector('meta[name="clerk-publishable-key"]')?.content?.trim() || '';
window.housoraAuthState = { status: key ? 'loading' : 'missing-key', error: null };

function showAuthError(message) {
  const text = message || 'Authentication is unavailable right now. Please refresh and try again.';
  window.housoraAuthState = { status: 'error', error: text };
  let banner = document.getElementById('housora-auth-error');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'housora-auth-error';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;z-index:99999;left:50%;top:18px;transform:translateX(-50%);max-width:min(560px,calc(100vw - 32px));padding:14px 18px;border:1px solid #e7b3b3;border-radius:10px;background:#fff5f5;color:#8b1e1e;box-shadow:0 8px 30px rgba(0,0,0,.14);font:14px/1.45 system-ui,sans-serif;text-align:center;';
    document.body.appendChild(banner);
  }
  banner.textContent = text;
  console.error('[Clerk]', text);
}

window.housoraOpenAuth = function(kind, options) {
  const method = kind === 'signup' ? 'openSignUp' : 'openSignIn';
  const redirect = options?.redirect || new URLSearchParams(window.location.search).get('redirect') || '/';
  let attempts = 0;
  const tryOpen = () => {
    if (window.housoraAuthState?.status === 'missing-key') {
      showAuthError('Sign in is temporarily unavailable. Please try again later.');
      return;
    }
    if (window.housoraAuthState?.status === 'error') {
      showAuthError('Authentication could not be initialized. Check the Clerk production domain and refresh the page.');
      return;
    }
    if (window.housoraAuthState?.status === 'ready' && window.Clerk && typeof window.Clerk[method] === 'function') {
      try {
        window.Clerk[method]({ fallbackRedirectUrl: redirect });
      } catch (error) {
        showAuthError('Authentication could not be opened. Please refresh and try again.');
      }
      return;
    }
    if (attempts++ < 120) setTimeout(tryOpen, 50);
    else showAuthError('Authentication is still loading. Please refresh the page and try again.');
  };
  tryOpen();
};

if (key) {
  (async () => {
    try {
      let attempts = 0;
      while (!window.Clerk && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      const ClerkConstructor = window.Clerk;
      if (!ClerkConstructor) throw new Error('Clerk browser SDK did not load');
      const clerk = typeof ClerkConstructor === 'function'
        ? new ClerkConstructor(key)
        : ClerkConstructor;
      const ClerkUI = window.__internal_ClerkUICtor;
      if (!ClerkUI) throw new Error('Clerk UI bundle did not load');
      await clerk.load({ ui: { ClerkUI } });
      window.Clerk = clerk;
      window.housoraAuthState = { status: 'ready', error: null };
      window.dispatchEvent(new CustomEvent('clerk:ready', { detail: { clerk } }));
    } catch (error) {
      window.housoraAuthState = { status: 'error', error: error?.message || 'Clerk failed to initialize' };
      console.error('[Clerk] Init failed:', error);
      window.dispatchEvent(new CustomEvent('clerk:error', { detail: { error } }));
      showAuthError('Authentication could not be initialized. Check the Clerk production domain and refresh the page.');
    }
  })();
} else {
  // Public pages remain usable when auth has not been configured. Surface the
  // problem only after someone explicitly attempts to sign in or create an account.
  console.warn('[Clerk] Authentication is not configured; auth actions are disabled.');
}
