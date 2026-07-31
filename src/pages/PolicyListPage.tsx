import {useState} from 'react';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import type {Policy, PolicyStatus, Persona, EnforcementMode} from '../components/Policy/types';
import type {SelectorValue} from '../components/PolicySelector/types';
import type {usePolicyStore} from '../stores/policyStore';

function statusVariant(s: PolicyStatus) {
  if (s === 'active') return 'success';
  if (s === 'mixed') return 'info';
  return 'warning';
}

function enforcementLabel(mode?: EnforcementMode): string {
  if (mode === 'full') return 'Full Enforcement';
  if (mode === 'selective') return 'Selective Enforcement';
  return 'Visibility Only';
}

function enforcementVariant(mode?: EnforcementMode) {
  if (mode === 'full') return 'error';
  if (mode === 'selective') return 'warning';
  return 'info';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
}

function getScopeLabels(scope: SelectorValue[]): string[] {
  if (scope.length === 0) return [];
  return scope.flatMap(s => {
    if ('labels' in s && Array.isArray(s.labels)) return s.labels;
    if ('names' in s && Array.isArray(s.names)) return s.names;
    return [s.category];
  });
}

type Tab = 'organization' | 'application';

interface PolicyRowProps {
  policy: Policy;
  tab: Tab;
  onEdit: () => void;
  onDelete: () => void;
  showActions: boolean;
  isReadOnly: boolean;
}

function PolicyRow({policy, tab, onEdit, onDelete, showActions, isReadOnly}: PolicyRowProps) {
  const scopeLabels = getScopeLabels(policy.scope);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: tab === 'organization'
        ? '2fr 1fr 0.5fr 0.8fr 1.2fr 0.8fr'
        : '2fr 1.5fr 0.5fr 0.8fr 1.2fr 0.8fr',
      gap: 'var(--spacing-3)',
      alignItems: 'center',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {isReadOnly ? (
        <Text size="sm">{policy.name}</Text>
      ) : (
        <Button label={policy.name} variant="tertiary" onClick={onEdit} />
      )}
      {tab === 'organization' ? (
        <Badge label={enforcementLabel(policy.enforcementMode)} variant={enforcementVariant(policy.enforcementMode)} />
      ) : (
        <div style={{display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap'}}>
          {scopeLabels.length > 0
            ? scopeLabels.slice(0, 3).map((label, i) => <Token key={i} label={label} />)
            : <Text size="sm" color="secondary">No scope</Text>
          }
          {scopeLabels.length > 3 && <Text size="sm" color="secondary">+{scopeLabels.length - 3}</Text>}
        </div>
      )}
      <Text size="sm">{policy.rules.length}</Text>
      <Badge label={policy.status} variant={statusVariant(policy.status)} />
      <Text size="sm" color="secondary">{formatDate(policy.lastModified)}</Text>
      {showActions ? (
        <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
          <Button label="Edit" variant="tertiary" size="sm" onClick={onEdit} />
          <Button label="Delete" variant="tertiary" size="sm" onClick={onDelete} />
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

interface PolicyListPageProps {
  store: ReturnType<typeof usePolicyStore>;
  persona: Persona;
  onCreatePolicy: () => void;
  onEditPolicy: (policyId: string) => void;
}

export default function PolicyListPage({store, persona, onCreatePolicy, onEditPolicy}: PolicyListPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('organization');

  const orgPolicies = store.policies.filter(p => p.type === 'organization');
  const appPolicies = store.policies.filter(p => p.type === 'application');
  const displayed = activeTab === 'organization' ? orgPolicies : appPolicies;
  const isOrgTabReadOnly = activeTab === 'organization' && persona === 'app_owner';

  const ORG_HEADERS = ['Name', 'Enforcement Mode', 'Rules', 'Status', 'Last Modified', 'Actions'];
  const APP_HEADERS = ['Name', 'Scope', 'Rules', 'Status', 'Last Modified', 'Actions'];
  const headers = activeTab === 'organization' ? ORG_HEADERS : APP_HEADERS;

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-4) var(--spacing-6)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Text size="xl" weight="bold">Policies</Text>
        {!isOrgTabReadOnly && (
          <Button label="+ Create Policy" variant="primary" onClick={onCreatePolicy} />
        )}
      </div>

      {/* Tabs */}
      <div style={{display: 'flex', gap: 'var(--spacing-1)', padding: '0 var(--spacing-6)', borderBottom: '1px solid var(--color-border)'}}>
        {(['organization', 'application'] as Tab[]).map(tab => (
          <div
            key={tab}
            style={{
              borderBottom: activeTab === tab ? '2px solid var(--color-border-active)' : '2px solid transparent',
              padding: 'var(--spacing-1) 0',
            }}
          >
            <Button
              label={tab === 'organization' ? 'Organization Policies' : 'Application Policies'}
              variant="tertiary"
              size="sm"
              onClick={() => setActiveTab(tab)}
            />
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{flex: 1, overflowY: 'auto'}}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'organization'
            ? '2fr 1fr 0.5fr 0.8fr 1.2fr 0.8fr'
            : '2fr 1.5fr 0.5fr 0.8fr 1.2fr 0.8fr',
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-2) var(--spacing-4)',
          borderBottom: '2px solid var(--color-border)',
          backgroundColor: 'var(--color-background-secondary)',
        }}>
          {headers.map(h => (
            <Text key={h} size="sm" weight="semibold" color="secondary">{h}</Text>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div style={{padding: 'var(--spacing-12)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-4)'}}>
            <Text color="secondary">No {activeTab} policies yet.</Text>
            {!isOrgTabReadOnly && (
              <Button label="+ Create Policy" variant="primary" onClick={onCreatePolicy} />
            )}
          </div>
        ) : (
          displayed.map(policy => (
            <PolicyRow
              key={policy.id}
              policy={policy}
              tab={activeTab}
              onEdit={() => onEditPolicy(policy.id)}
              onDelete={() => store.deletePolicy(policy.id)}
              showActions={!isOrgTabReadOnly}
              isReadOnly={isOrgTabReadOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}
