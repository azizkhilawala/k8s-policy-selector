import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {AddRulePanel} from './components/PolicySelector';
import type {RuleFormValue} from './components/PolicySelector';

export default function App() {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState<RuleFormValue | null>(null);

  return (
    <div style={{display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background-body)'}}>
      {/* Simulated main page */}
      <div style={{flex: 1, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>
        <Text size="xl" weight="bold">Containers Policy</Text>
        <div>
          <Button label="+ Add Rule" onClick={() => setOpen(true)} />
        </div>
        {saved && (
          <pre style={{marginTop: 'var(--spacing-4)'}}>
            <Text size="sm">{JSON.stringify(saved, null, 2)}</Text>
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
