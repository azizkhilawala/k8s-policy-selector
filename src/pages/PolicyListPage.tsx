import {useState} from 'react';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import type {Policy, PolicyStatus, Persona} from '../components/Policy/types';
import type {usePolicyStore} from '../stores/policyStore';

function statusVariant(s: PolicyStatus) {
  if (s === 'active') return 'success';
  if (s === 'mixed') return 'info';
  return 'warning';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
}

interface PolicyRowProps {
  policy: Policy;
  onEdit: () => void;
  onDelete: () => void;
  showActions: boolean;
}

function PolicyRow({policy, onEdit, onDelete, showActions}: PolicyRowProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 80px 100px 160px 120px',
      gap: 'var(--spacing-3)',
      alignItems: 'center',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <Button label={policy.name} variant="tertiary" onClick={onEdit} />
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

type Tab = 'organization' | 'application';

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

  const TABLE_HEADERS = ['Name', 'Rules', 'Status', 'Last Modified', 'Actions'];

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
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'var(--spacing-3) var(--spacing-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-border-active)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <Text
              size="sm"
              weight={activeTab === tab ? 'semibold' : 'regular'}
              color={activeTab === tab ? 'primary' : 'secondary'}
            >
              {tab === 'organization' ? 'Organization Policies' : 'Application Policies'}
            </Text>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{flex: 1, overflowY: 'auto'}}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 80px 100px 160px 120px',
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-2) var(--spacing-4)',
          borderBottom: '2px solid var(--color-border)',
          backgroundColor: 'var(--color-background-secondary)',
        }}>
          {TABLE_HEADERS.map(h => (
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
              onEdit={() => onEditPolicy(policy.id)}
              onDelete={() => store.deletePolicy(policy.id)}
              showActions={!isOrgTabReadOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}
