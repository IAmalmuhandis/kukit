import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { getPermission, requestPermission } from './utils/notifications';
import TimerView from './components/TimerView';
import GroceriesView from './components/GroceriesView';
import ReportsView from './components/ReportsView';
import SleepWarning from './components/SleepWarning';
import AuthScreen from './components/AuthScreen';
import Logo from './components/Logo';
import './App.css';

const STORAGE_KEY = 'cook-timer.active-tab.v1';
const TABS = [
  { id: 'timer', label: '⏲ Timer' },
  { id: 'groceries', label: '🛒 Groceries' },
  { id: 'reports', label: '📊 Reports' },
];

export default function App() {
  const { status, user, signout } = useAuth();
  const [permission, setPermission] = useState(getPermission);
  const [tab, setTab] = useState(() => localStorage.getItem(STORAGE_KEY) || 'timer');

  if (status === 'loading') {
    return (
      <div className="app">
        <p className="app__loading">Loading…</p>
      </div>
    );
  }

  if (status === 'anon') {
    return <AuthScreen />;
  }

  function selectTab(id) {
    setTab(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  async function handleEnableNotifications() {
    const result = await requestPermission();
    setPermission(result);
  }

  return (
    <div className="app">
      <header className="app__header no-print">
        <div className="app__title">
          <Logo className="app__title-icon" />
          <div>
            <h1>KUKIT</h1>
            <p className="app__subtitle">Start it, walk away, don't burn dinner.</p>
          </div>
        </div>
        <div className="app__header-actions">
          {tab === 'timer' && permission !== 'granted' && permission !== 'unsupported' && (
            <button type="button" className="btn btn--outline btn--small" onClick={handleEnableNotifications}>
              {permission === 'denied' ? 'Notifications blocked' : 'Enable notifications'}
            </button>
          )}
          <span className="app__user" title={user?.email}>
            {user?.email}
          </span>
          <button type="button" className="btn btn--outline btn--small" onClick={signout}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="tab-nav no-print" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab-nav__btn ${tab === t.id ? 'tab-nav__btn--active' : ''}`}
            onClick={() => selectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'timer' && <SleepWarning />}

      <main className="app__main">
        {tab === 'timer' && <TimerView />}
        {tab === 'groceries' && <GroceriesView />}
        {tab === 'reports' && <ReportsView />}
      </main>

      <footer className="app__footer no-print">
        Synced to your account — pick up where you left off on any device.
      </footer>
    </div>
  );
}
