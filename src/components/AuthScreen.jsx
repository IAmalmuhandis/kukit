import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import Logo from './Logo';

const HAS_GOOGLE = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function AuthScreen() {
  const { signin, signup, signinWithGoogle } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') await signin(email, password);
      else await signup(email, password);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setError('');
    setBusy(true);
    try {
      await signinWithGoogle(credential);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="app__title auth-card__title">
          <Logo className="app__title-icon" />
          <div>
            <h1>KUKIT</h1>
            <p className="app__subtitle">Sign in to sync your foods and lists across devices.</p>
          </div>
        </div>

        {HAS_GOOGLE && (
          <>
            <GoogleSignInButton onCredential={handleGoogleCredential} />
            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {mode === 'signup' && <p className="auth-form__hint">At least 8 characters.</p>}
          {error && <p className="auth-form__error">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="link-btn auth-card__switch"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError('');
          }}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
