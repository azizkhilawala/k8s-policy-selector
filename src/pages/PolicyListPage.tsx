import {useState, useMemo} from 'react';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {DropdownMenu, DropdownMenuItem} from '@astryxdesign/core/DropdownMenu';
import {Table, proportional, pixel} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
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

type PolicyTab = 'organization' | 'application';

// Row shape for the Table data prop
type PolicyRow = Record<string, unknown> & {
  id: string;
  _policy: Policy;
};

interface PolicyListPageProps {
  store: ReturnType<typeof usePolicyStore>;
  persona: Persona;
  onCreatePolicy: () => void;
  onEditPolicy: (policyId: string) => void;
}

export default function PolicyListPage({store, persona, onCreatePolicy, onEditPolicy}: PolicyListPageProps) {
  const [activeTab, setActiveTab] = useState<PolicyTab>('organization');

  const orgPolicies = store.policies.filter(p => p.type === 'organization');
  const appPolicies = store.policies.filter(p => p.type === 'application');
  const displayed = activeTab === 'organization' ? orgPolicies : appPolicies;
  const isOrgTabReadOnly = activeTab === 'organization' && persona === 'app_owner';

  // Convert Policy[] to Record<string, unknown>[] with _policy reference
  const tableData: PolicyRow[] = useMemo(
    () => displayed.map(p => ({id: p.id, _policy: p} as PolicyRow)),
    [displayed],
  );

  // Shared columns for both tabs
  const nameColumn: TableColumn<PolicyRow> = {
    key: 'name',
    header: 'Name',
    width: proportional(2),
    renderCell: (row) => {
      const policy = row._policy as Policy;
      return isOrgTabReadOnly ? (
        <Text size="sm">{policy.name}</Text>
      ) : (
        <Button label={policy.name} variant="tertiary" onClick={() => onEditPolicy(policy.id)} />
      );
    },
  };

  const rulesColumn: TableColumn<PolicyRow> = {
    key: 'rules',
    header: 'Rules',
    width: proportional(0.5),
    renderCell: (row) => {
      const policy = row._policy as Policy;
      return <Text size="sm">{policy.rules.length}</Text>;
    },
  };

  const statusColumn: TableColumn<PolicyRow> = {
    key: 'status',
    header: 'Status',
    width: proportional(0.8),
    renderCell: (row) => {
      const policy = row._policy as Policy;
      return <Badge label={policy.status} variant={statusVariant(policy.status)} />;
    },
  };

  const lastModifiedColumn: TableColumn<PolicyRow> = {
    key: 'lastModified',
    header: 'Last Modified',
    width: proportional(1.2),
    renderCell: (row) => {
      const policy = row._policy as Policy;
      return <Text size="sm" color="secondary">{formatDate(policy.lastModified)}</Text>;
    },
  };

  const actionsColumn: TableColumn<PolicyRow> = {
    key: 'actions',
    header: '',
    width: pixel(50),
    renderCell: (row) => {
      const policy = row._policy as Policy;
      if (isOrgTabReadOnly) return <div />;
      return (
        <DropdownMenu button={{label: '⋮', variant: 'ghost', size: 'sm'}} placement="start">
          <DropdownMenuItem label="Edit" onClick={() => onEditPolicy(policy.id)} />
          <DropdownMenuItem label="Delete" onClick={() => store.deletePolicy(policy.id)} />
        </DropdownMenu>
      );
    },
  };

  const orgColumns: TableColumn<PolicyRow>[] = [
    nameColumn,
    {
      key: 'enforcementMode',
      header: 'Enforcement Mode',
      width: proportional(1),
      renderCell: (row) => {
        const policy = row._policy as Policy;
        return (
          <Badge
            label={enforcementLabel(policy.enforcementMode)}
            variant={enforcementVariant(policy.enforcementMode)}
          />
        );
      },
    },
    rulesColumn,
    statusColumn,
    lastModifiedColumn,
    actionsColumn,
  ];

  const appColumns: TableColumn<PolicyRow>[] = [
    nameColumn,
    {
      key: 'scope',
      header: 'Scope',
      width: proportional(1.5),
      renderCell: (row) => {
        const policy = row._policy as Policy;
        const scopeLabels = getScopeLabels(policy.scope);
        return (
          <div style={{display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap'}}>
            {scopeLabels.length > 0
              ? scopeLabels.slice(0, 3).map((label, i) => <Token key={i} label={label} />)
              : <Text size="sm" color="secondary">No scope</Text>
            }
            {scopeLabels.length > 3 && (
              <Text size="sm" color="secondary">+{scopeLabels.length - 3}</Text>
            )}
          </div>
        );
      },
    },
    rulesColumn,
    statusColumn,
    lastModifiedColumn,
    actionsColumn,
  ];

  const columns = activeTab === 'organization' ? orgColumns : appColumns;

  const emptyState = (
    <div style={{
      padding: 'var(--spacing-12)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--spacing-4)',
    }}>
      <Text color="secondary">No {activeTab} policies yet.</Text>
      {!isOrgTabReadOnly && (
        <Button label="+ Create Policy" variant="primary" onClick={onCreatePolicy} />
      )}
    </div>
  );

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
      <div style={{padding: '0 var(--spacing-6)'}}>
        <TabList value={activeTab} onChange={v => setActiveTab(v as PolicyTab)} size="sm" hasDivider>
          <Tab value="organization" label="Organization Policies" />
          <Tab value="application" label="Application Policies" />
        </TabList>
      </div>

      {/* Table */}
      <div style={{flex: 1, overflowY: 'auto'}}>
        <Table<PolicyRow>
          data={tableData}
          columns={columns}
          idKey="id"
          density="balanced"
          dividers="rows"
          hasHover
          emptyState={emptyState}
        />
      </div>
    </div>
  );
}
