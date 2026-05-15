import { VITE_DEMO_MODE } from './lib/env';

export default function DemoBanner() {
  if (!VITE_DEMO_MODE) return null;
  return (
    <aside
      role="status"
      aria-label="Demo mode notice"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '8px 16px',
        background: 'rgba(8, 128, 121, 0.92)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        textAlign: 'center',
        letterSpacing: 0.2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
      }}
    >
      Demo data — backend not connected. Live API disabled; charger features sourced from a static snapshot.
    </aside>
  );
}
