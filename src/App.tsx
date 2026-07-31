import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {Selector} from '@astryxdesign/core/Selector';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {AddRulePanel} from './components/PolicySelector';
import type {RuleFormValue} from './components/PolicySelector';
import {usePolicyStore} from './stores/policyStore';
import PolicyListPage from './pages/PolicyListPage';
import PolicyEditorPage from './pages/PolicyEditorPage';
import type {Persona} from './components/Policy/types';

type View = 'demo' | 'policies' | 'editor';

const PERSONA_OPTIONS = [
  {value: 'admin', label: 'Security Admin'},
  {value: 'app_owner', label: 'App Owner'},
];

export default function App() {
  const [view, setView] = useState<View>('policies');
  const [editorPolicyId, setEditorPolicyId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('admin');
  const [demoOpen, setDemoOpen] = useState(true);
  const [saved, setSaved] = useState<RuleFormValue | null>(null);
  const store = usePolicyStore();

  const openEditor = (policyId: string | null) => {
    setEditorPolicyId(policyId);
    setView('editor');
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background-surface)'}}>
      {/* Top nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-4)',
        padding: 'var(--spacing-3) var(--spacing-6)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-background-surface)',
      }}>
        <Text size="lg" weight="bold">MetaAstryx</Text>
        <div style={{width: '1px', height: 'var(--spacing-6)', backgroundColor: 'var(--color-border)'}} />
        <TabList value={view === 'editor' ? 'policies' : view} onChange={v => setView(v as View)} size="sm">
          <Tab value="demo" label="Containers Policy" />
          <Tab value="policies" label="Policies" />
        </TabList>
        <div style={{flex: 1}} />
        <div style={{flex: '0 0 auto', minWidth: 'var(--spacing-40)'}}>
          <Selector
            label="Persona"
            value={persona}
            options={PERSONA_OPTIONS}
            onChange={v => setPersona(v as Persona)}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
        {view === 'demo' && (
          <div style={{display: 'flex', height: '100%'}}>
            <div style={{flex: 1, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>
              <Text size="xl" weight="bold">Containers Policy</Text>
              <Button label="+ Add Rule" onClick={() => setDemoOpen(true)} />
              {saved && (
                <pre style={{marginTop: 'var(--spacing-4)'}}>
                  <Text size="sm">{JSON.stringify(saved, null, 2)}</Text>
                </pre>
              )}
            </div>
            {demoOpen && (
              <AddRulePanel
                onSave={v => { setSaved(v); setDemoOpen(false); }}
                onCancel={() => setDemoOpen(false)}
                persona={persona}
              />
            )}
          </div>
        )}

        {view === 'policies' && (
          <PolicyListPage
            store={store}
            persona={persona}
            onCreatePolicy={() => openEditor(null)}
            onEditPolicy={id => openEditor(id)}
          />
        )}

        {view === 'editor' && (
          <PolicyEditorPage
            policyId={editorPolicyId}
            onBack={() => setView('policies')}
            store={store}
          />
        )}
      </div>
    </div>
  );
}
