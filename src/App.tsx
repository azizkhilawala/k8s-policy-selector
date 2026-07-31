import {useState} from 'react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {TopNav, TopNavHeading, TopNavItem} from '@astryxdesign/core/TopNav';
import {Avatar} from '@astryxdesign/core/Avatar';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Text} from '@astryxdesign/core/Text';
import {Selector} from '@astryxdesign/core/Selector';
import {AddRulePanel} from './components/PolicySelector';
import type {RuleFormValue} from './components/PolicySelector';
import {usePolicyStore} from './stores/policyStore';
import PolicyListPage from './pages/PolicyListPage';
import PolicyEditorPage from './pages/PolicyEditorPage';
import type {Persona} from './components/Policy/types';
import {Button} from '@astryxdesign/core/Button';

type View = 'demo' | 'policies' | 'editor';

type NavPage = 'dashboard' | 'insights' | 'quarantine' | 'explore' | 'segmentation'
  | 'labels' | 'servers' | 'firewalls' | 'cloud' | 'usage' | 'access' | 'settings' | 'support';

const PERSONA_OPTIONS = [
  {value: 'admin', label: 'Security Admin'},
  {value: 'app_owner', label: 'App Owner'},
];

export default function App() {
  const [view, setView] = useState<View>('policies');
  const [navPage, setNavPage] = useState<NavPage>('segmentation');
  const [editorPolicyId, setEditorPolicyId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('admin');
  const [demoOpen, setDemoOpen] = useState(true);
  const [saved, setSaved] = useState<RuleFormValue | null>(null);
  const [search, setSearch] = useState('');
  const store = usePolicyStore();

  const openEditor = (policyId: string | null) => {
    setEditorPolicyId(policyId);
    setView('editor');
  };

  const sideNav = (
    <SideNav
      header={
        <SideNavHeading
          heading="Illumio"
          superheading="CloudSecure"
        />
      }
      collapsible={{defaultIsCollapsed: false}}
    >
      <SideNavSection title="Navigation" isHeaderHidden>
        <SideNavItem label="Dashboard" isSelected={navPage === 'dashboard'} onClick={() => setNavPage('dashboard')} collapsible>
          <SideNavItem label="Servers & Endpoints" onClick={() => setNavPage('servers')} />
          <SideNavItem label="Cloud" onClick={() => setNavPage('cloud')} />
          <SideNavItem label="Ransomware Protection" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Insights" isSelected={navPage === 'insights'} onClick={() => setNavPage('insights')} collapsible>
          <SideNavItem label="Insights Agent" onClick={() => {}} />
          <SideNavItem label="Active Persona" onClick={() => {}} />
          <SideNavItem label="Network Compliance" onClick={() => {}} collapsible>
            <SideNavItem label="Network Posture" onClick={() => {}} />
            <SideNavItem label="External Data Transfer" onClick={() => {}} />
            <SideNavItem label="Shadow LLMs" onClick={() => {}} />
            <SideNavItem label="DORA Compliance" onClick={() => {}} />
            <SideNavItem label="Containers" onClick={() => {}} />
            <SideNavItem label="Label Insights" onClick={() => {}} />
          </SideNavItem>
          <SideNavItem label="Network Threats" onClick={() => {}} collapsible>
            <SideNavItem label="Country Insights" onClick={() => {}} />
            <SideNavItem label="Firewall Insights" onClick={() => {}} />
            <SideNavItem label="Risky Traffic" onClick={() => {}} />
            <SideNavItem label="Malicious IP Threats" onClick={() => {}} />
            <SideNavItem label="Anomaly Detection" onClick={() => {}} />
          </SideNavItem>
          <SideNavItem label="Identity Mapping" onClick={() => {}} collapsible>
            <SideNavItem label="Identity Graph" onClick={() => {}} />
            <SideNavItem label="Identity Insights" onClick={() => {}} />
          </SideNavItem>
          <SideNavItem label="Perimeter Insight" onClick={() => {}} />
          <SideNavItem label="Resource Traffic" onClick={() => {}} />
          <SideNavItem label="Traffic Rules" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Quarantine" isSelected={navPage === 'quarantine'} onClick={() => setNavPage('quarantine')} />

        <SideNavItem label="Explore" isSelected={navPage === 'explore'} onClick={() => setNavPage('explore')} collapsible>
          <SideNavItem label="Map" onClick={() => {}} />
          <SideNavItem label="Traffic" onClick={() => {}} />
          <SideNavItem label="Mesh" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Segmentation" isSelected={navPage === 'segmentation'} onClick={() => { setNavPage('segmentation'); setView('policies'); }} collapsible>
          <SideNavItem label="All Policies" isSelected={navPage === 'segmentation' && view === 'policies'} onClick={() => { setNavPage('segmentation'); setView('policies'); }} />
          <SideNavItem label="Deny Rules" onClick={() => {}} />
          <SideNavItem label="Drafts and Versions" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Policy Objects" onClick={() => {}} collapsible>
          <SideNavItem label="Services" onClick={() => {}} />
          <SideNavItem label="IP Lists" onClick={() => {}} />
          <SideNavItem label="User Groups" onClick={() => {}} />
          <SideNavItem label="Virtual Services" onClick={() => {}} />
          <SideNavItem label="Virtual Servers" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Label Management" isSelected={navPage === 'labels'} onClick={() => setNavPage('labels')} collapsible>
          <SideNavItem label="Labels" onClick={() => {}} />
          <SideNavItem label="Label Groups" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Label Method" onClick={() => {}} collapsible>
          <SideNavItem label="AI Labeling" onClick={() => {}} />
          <SideNavItem label="Data Center Labeling" onClick={() => {}} />
          <SideNavItem label="Cloud Labeling Rules" onClick={() => {}} />
          <SideNavItem label="Tag to Label Mapping" onClick={() => {}} />
          <SideNavItem label="System Generated Labels" onClick={() => {}} />
          <SideNavItem label="Label Types" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Servers & Endpoints" isSelected={navPage === 'servers'} onClick={() => setNavPage('servers')} collapsible>
          <SideNavItem label="Workloads" onClick={() => {}} />
          <SideNavItem label="Pairing Profiles" onClick={() => {}} />
          <SideNavItem label="Applications" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Firewall" isSelected={navPage === 'firewalls'} onClick={() => setNavPage('firewalls')} />

        <SideNavItem label="Cloud" isSelected={navPage === 'cloud'} onClick={() => setNavPage('cloud')} collapsible>
          <SideNavItem label="Onboarding" onClick={() => {}} />
          <SideNavItem label="Security Review" onClick={() => {}} />
          <SideNavItem label="Inventory" onClick={() => {}} />
          <SideNavItem label="Explore" onClick={() => {}} collapsible>
            <SideNavItem label="Map" onClick={() => {}} />
            <SideNavItem label="Traffic" onClick={() => {}} />
            <SideNavItem label="Reports" onClick={() => {}} />
          </SideNavItem>
          <SideNavItem label="Applications" onClick={() => {}} collapsible>
            <SideNavItem label="Application Discovery" onClick={() => {}} />
            <SideNavItem label="Deployments" onClick={() => {}} />
            <SideNavItem label="Application Definitions" onClick={() => {}} />
            <SideNavItem label="Discovery Rules" onClick={() => {}} />
          </SideNavItem>
          <SideNavItem label="Events" onClick={() => {}} />
        </SideNavItem>

        <SideNavItem label="Usage" isSelected={navPage === 'usage'} onClick={() => setNavPage('usage')} />
      </SideNavSection>

      <SideNavSection title="System" isHeaderHidden>
        <SideNavItem label="Access" isSelected={navPage === 'access'} onClick={() => setNavPage('access')} collapsible>
          <SideNavItem label="Roles & Permissions" onClick={() => {}} />
        </SideNavItem>
        <SideNavItem label="Settings" isSelected={navPage === 'settings'} onClick={() => setNavPage('settings')} collapsible>
          <SideNavItem label="General" onClick={() => {}} />
        </SideNavItem>
        <SideNavItem label="Support" isSelected={navPage === 'support'} onClick={() => setNavPage('support')} collapsible>
          <SideNavItem label="Documentation" onClick={() => {}} />
        </SideNavItem>
      </SideNavSection>
    </SideNav>
  );

  const topNav = (
    <TopNav
      heading={
        <TopNavHeading heading="All Policies" superheading="Segmentation" />
      }
      endContent={
        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)'}}>
          <div style={{minWidth: 'var(--spacing-48)'}}>
            <TextInput
              label="Search"
              placeholder="Search..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <div style={{minWidth: 'var(--spacing-40)'}}>
            <Selector
              label="Persona"
              value={persona}
              options={PERSONA_OPTIONS}
              onChange={v => setPersona(v as Persona)}
            />
          </div>
          <Avatar name="Aziz Khilawala" size="md" />
        </div>
      }
    />
  );

  return (
    <AppShell
      topNav={topNav}
      sideNav={sideNav}
      variant="surface"
    >
      {navPage === 'segmentation' && view === 'policies' && (
        <PolicyListPage
          store={store}
          persona={persona}
          onCreatePolicy={() => openEditor(null)}
          onEditPolicy={id => openEditor(id)}
        />
      )}

      {navPage === 'segmentation' && view === 'editor' && (
        <PolicyEditorPage
          policyId={editorPolicyId}
          onBack={() => setView('policies')}
          store={store}
        />
      )}

      {navPage === 'segmentation' && view === 'demo' && (
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

      {navPage !== 'segmentation' && (
        <div style={{padding: 'var(--spacing-8)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Text size="lg" color="secondary">{navPage.charAt(0).toUpperCase() + navPage.slice(1)} — coming soon</Text>
        </div>
      )}
    </AppShell>
  );
}
