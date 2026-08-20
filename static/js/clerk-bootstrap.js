const key = document.querySelector('meta[name="clerk-publishable-key"]')?.content?.trim() || '';
window.housoraAuthState = { status: key ? 'loading' : 'missing-key', error: null };

function clerkFrontendApiFromKey(publishableKey) {
  try {
    const encoded = publishableKey.split('_')[2] || '';
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return atob(padded).replace(/\$$/, '');
  } catch (_) {
    return '';
  }
}

function loadClerkUi(publishableKey) {
  if (window.__internal_ClerkUICtor) return Promise.resolve(window.__internal_ClerkUICtor);

  const frontendApi = clerkFrontendApiFromKey(publishableKey);
  if (!frontendApi) return Promise.reject(new Error('The Clerk publishable key could not be decoded.'));

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-housora-clerk-ui]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.__internal_ClerkUICtor), { once: true });
      existing.addEventListener('error', () => reject(new Error('The Clerk UI bundle failed to load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://${frontendApi}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.housoraClerkUi = 'true';
    script.addEventListener('load', () => {
      if (window.__internal_ClerkUICtor) resolve(window.__internal_ClerkUICtor);
      else reject(new Error('The Clerk UI bundle loaded without exposing its constructor.'));
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('The Clerk UI bundle failed to load.')), { once: true });
    document.head.appendChild(script);
  });
}

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
      showAuthError(window.housoraAuthState.error || 'Authentication could not be initialized. Please refresh the page.');
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
      const ClerkUI = await loadClerkUi(key);
      const clerk = typeof ClerkConstructor === 'function'
        ? new ClerkConstructor(key)
        : ClerkConstructor;
      await clerk.load({
        ui: { ClerkUI },
      });
      window.Clerk = clerk;
      window.housoraAuthState = { status: 'ready', error: null };
      window.dispatchEvent(new CustomEvent('clerk:ready', { detail: { clerk } }));
    } catch (error) {
      const message = error?.message || 'Authentication failed to initialize.';
      window.housoraAuthState = { status: 'error', error: message };
      console.error('[Clerk] Init failed:', error);
      window.dispatchEvent(new CustomEvent('clerk:error', { detail: { error } }));
      showAuthError(message);
    }
  })();
} else {
  // Public pages remain usable when auth has not been configured. Surface the
  // problem only after someone explicitly attempts to sign in or create an account.
  console.warn('[Clerk] Authentication is not configured; auth actions are disabled.');
}
