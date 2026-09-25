// Scope authentication bootstrap.
// This file intentionally handles the login screen independently of the map application.
(function () {
  'use strict';

  const LOGIN_USERNAME = 'thomas.hollinger';
  const LOGIN_EMAIL = 'thomas.hollinger@lennar.com';
  const FIREBASE_APP_NAME = 'scopeAuth';

  const gate = document.getElementById('scopeLoginGate');
  const appShell = document.getElementById('appShell');
  const username = document.getElementById('scopeLoginUsername');
  const password = document.getElementById('scopeLoginPassword');
  const error = document.getElementById('scopeLoginError');
  const submit = document.getElementById('scopeLoginSubmit');

  function showApp(show) {
    if (gate) gate.setAttribute('aria-hidden', show ? 'true' : 'false');
    if (appShell) {
      if (show) {
        appShell.removeAttribute('hidden');
        appShell.style.removeProperty('display');
      } else {
        appShell.setAttribute('hidden', '');
        appShell.style.setProperty('display', 'none', 'important');
      }
    }
    document.body.classList.toggle('scope-authenticated', !!show);
  }

  function message(text) {
    if (error) error.textContent = text || '';
  }

  showApp(false);

  globalThis.SCOPE_LOGIN_PROMISE = new Promise(async resolve => {
    if (!username || !password || !submit || !error) {
      resolve(false);
      return;
    }

    let auth = null;
    try {
      if (!globalThis.firebase) throw new Error('Firebase SDK is unavailable.');
      const cfg = globalThis.SCOPE_FIREBASE_CONFIG || {};
      if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId) {
        throw new Error('Scope Firebase configuration is missing.');
      }

      const app = firebase.apps.find(a => a.name === FIREBASE_APP_NAME)
        || firebase.initializeApp(cfg, FIREBASE_APP_NAME);
      auth = firebase.auth(app);
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      const existing = auth.currentUser || await new Promise(done => {
        let unsub = auth.onAuthStateChanged(user => {
          unsub();
          done(user || null);
        });
      });

      if (existing && String(existing.email || '').toLowerCase() === LOGIN_EMAIL) {
        showApp(true);
        resolve(true);
        return;
      }
      if (existing) {
        try { await auth.signOut(); } catch (_) {}
      }
    } catch (err) {
      console.error('Scope Firebase initialization failed:', err);
      message('Unable to connect to Firebase. Please try again.');
      resolve(false);
      return;
    }

    let finished = false;
    const login = async function () {
      if (finished || submit.disabled) return;
      message('');

      const enteredUsername = username.value.trim().toLowerCase();
      const enteredPassword = password.value;
      if (!enteredUsername || !enteredPassword) {
        message('Enter your username and password.');
        return;
      }
      if (enteredUsername !== LOGIN_USERNAME) {
        message('Incorrect username or password.');
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Signing in…';
      try {
        const result = await auth.signInWithEmailAndPassword(LOGIN_EMAIL, enteredPassword);
        if (!result.user || String(result.user.email || '').toLowerCase() !== LOGIN_EMAIL) {
          throw new Error('Unauthorized account');
        }
        finished = true;
        password.value = '';
        showApp(true);
        resolve(true);
      } catch (err) {
        console.error('Scope Firebase sign-in failed:', err);
        const code = String(err && err.code || '');
        if (code === 'auth/operation-not-allowed') {
          message('Firebase Email/Password sign-in is not enabled.');
        } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
          message('Incorrect username or password.');
        } else if (code === 'auth/too-many-requests') {
          message('Too many attempts. Please wait a moment and try again.');
        } else {
          message('Unable to sign in: ' + (err && err.message ? err.message : 'Firebase error'));
        }
        submit.disabled = false;
        submit.textContent = 'Login';
        password.focus();
      }
    };

    submit.addEventListener('click', login);
    username.addEventListener('keydown', e => { if (e.key === 'Enter') password.focus(); });
    password.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    username.focus();
  });
})();
