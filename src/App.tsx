import {useState} from 'react';
import {AddRulePanel} from './components/PolicySelector';
import type {RuleFormValue} from './components/PolicySelector';

export default function App() {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState<RuleFormValue | null>(null);

  return (
    <div style={{display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background-body)'}}>
      {/* Simulated main page */}
      <div style={{flex: 1, padding: 'var(--spacing-6)'}}>
        <h1 style={{color: 'var(--color-text-primary)'}}>Containers Policy</h1>
        <button onClick={() => setOpen(true)} style={{marginTop: 'var(--spacing-4)'}}>
          + Add Rule
        </button>
        {saved && (
          <pre style={{marginTop: 'var(--spacing-4)', fontSize: '0.75rem'}}>
            {JSON.stringify(saved, null, 2)}
          </pre>
        )}
      </div>

      {/* Slide-out panel */}
      {open && (
        <AddRulePanel
          onSave={v => { setSaved(v); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
}
