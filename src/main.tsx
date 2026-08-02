import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class StartupErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('KSM POS startup error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', padding: 24, background: '#020617', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: '#fb7185' }}>KSM POS could not start</h1>
          <p>Please send this error message to the developer:</p>
          <pre style={{ whiteSpace: 'pre-wrap', padding: 16, borderRadius: 12, background: '#111827', color: '#fde68a' }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => { localStorage.removeItem('ksm_user'); location.reload(); }} style={{ padding: '12px 18px', border: 0, borderRadius: 10, background: '#2563eb', color: '#fff', fontWeight: 700 }}>
            Reset Login and Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element was not found.');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  </React.StrictMode>
);


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => console.warn('KSM POS service worker:', error));
  });
}
