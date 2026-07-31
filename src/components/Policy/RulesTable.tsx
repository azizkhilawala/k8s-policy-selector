import {useMemo} from 'react';
import {Table, proportional, pixel} from '@astryxdesign/core/Table';
import type {TableColumn} from '@astryxdesign/core/Table';
import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {RULE_TYPE_ORDER} from '../../stores/policyStore';
import type {Rule, RuleType, RuleStatus} from './types';
import type {SelectorValue} from '../PolicySelector/types';

function ruleTypeBadgeVariant(type: RuleType) {
  if (type === 'override_deny') return 'error' as const;
  if (type === 'deny') return 'warning' as const;
  return 'success' as const;
}

function ruleTypeLabel(type: RuleType) {
  if (type === 'override_deny') return 'Override Deny';
  if (type === 'deny') return 'Deny';
  return 'Allow';
}

function statusBadgeVariant(status: RuleStatus) {
  if (status === 'active') return 'success' as const;
  if (status === 'modified') return 'info' as const;
  return 'warning' as const;
}

function TokenPills({items, max = 3}: {items: string[]; max?: number}) {
  const visible = items.slice(0, max);
  const overflow = items.length - max;
  return (
    <div style={{display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', alignItems: 'center'}}>
      {visible.map((label, i) => <Token key={i} label={label} />)}
      {overflow > 0 && <Text size="sm" color="secondary">+{overflow}</Text>}
    </div>
  );
}

function getSelectorLabels(s: SelectorValue): string[] {
  switch (s.category) {
    case 'k8s_labels':
    case 'illumio_labels':
      return s.labels;
    case 'k8s_namespace':
      if (s.mode === 'wildcard') return ['Any namespace'];
      if (s.mode === 'intra') return ['Same namespace'];
      if (s.mode === 'name') return s.names;
      return s.labelExpressions.map(e => `${e.key} ${e.operator} ${e.values.join(',')}`);
    case 'k8s_cluster':
      return s.clusterNames;
    case 'k8s_service_account':
      return s.serviceAccounts;
    case 'fqdn':
    case 'k8s_service':
    case 'k8s_ingress':
    case 'k8s_gateway':
      return s.names;
    case 'ip_list':
      return s.ids;
    case 'cloud_aws_account':
      return s.accountIds;
    case 'cloud_aws_vpc':
      return s.vpcs.map(v => v.id || v.region);
    case 'cloud_aws_subnet':
      return s.subnets.map(sub => sub.id || sub.region);
    case 'cloud_azure_subscription':
      return s.subscriptionIds;
    case 'cloud_azure_vnet':
      return s.vnets.map(v => v.id || v.resourceGroup);
    case 'cloud_azure_subnet':
      return s.resourceIds;
    default:
      return [(s as {category: string}).category];
  }
}

type RuleRow = Rule & Record<string, unknown> & {_index: number};

interface RulesTableProps {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
  onToggleEnabled: (ruleId: string, enabled: boolean) => void;
}

export default function RulesTable({rules, onEdit, onDelete, onToggleEnabled}: RulesTableProps) {
  const sorted = useMemo(
    () => [...rules]
      .sort((a, b) => RULE_TYPE_ORDER[a.type] - RULE_TYPE_ORDER[b.type])
      .map((r, i) => ({...r, _index: i + 1}) as RuleRow),
    [rules],
  );

  const columns: TableColumn<RuleRow>[] = useMemo(() => [
    {
      key: '_index',
      header: '#',
      width: pixel(40),
      renderCell: (item: RuleRow) => <Text size="sm" color="secondary">{item._index}</Text>,
    },
    {
      key: 'type',
      header: 'Type',
      width: proportional(0.8),
      renderCell: (item: RuleRow) => <Badge label={ruleTypeLabel(item.type)} variant={ruleTypeBadgeVariant(item.type)} />,
    },
    {
      key: 'scopeType',
      header: 'Scope',
      width: proportional(0.7),
      renderCell: (item: RuleRow) => <Text size="sm" color="secondary">{item.scopeType === 'intra' ? 'Intra-scope' : 'Extra-scope'}</Text>,
    },
    {
      key: 'enabled',
      header: 'Enabled',
      width: pixel(70),
      renderCell: (item: RuleRow) => (
        <Button
          label={item.enabled ? 'On' : 'Off'}
          variant="tertiary"
          size="sm"
          onClick={() => onToggleEnabled(item.id, !item.enabled)}
        />
      ),
    },
    {
      key: 'sources',
      header: 'Sources',
      width: proportional(1.5),
      renderCell: (item: RuleRow) => {
        const labels = (item.sources as SelectorValue[]).flatMap(s => getSelectorLabels(s));
        return <TokenPills items={labels.length > 0 ? labels : ['Any']} />;
      },
    },
    {
      key: 'destinations',
      header: 'Destinations',
      width: proportional(1.5),
      renderCell: (item: RuleRow) => {
        const labels = (item.destinations as SelectorValue[]).flatMap(s => getSelectorLabels(s));
        return <TokenPills items={labels.length > 0 ? labels : ['Any']} />;
      },
    },
    {
      key: 'services',
      header: 'Services',
      width: proportional(1.2),
      renderCell: (item: RuleRow) => {
        const labels = (item.services as Rule['services']).map(s =>
          s.fromPort === s.toPort ? `${s.protocol} ${s.fromPort}` : `${s.protocol} ${s.fromPort}-${s.toPort}`,
        );
        return <TokenPills items={labels.length > 0 ? labels : ['Any']} max={2} />;
      },
    },
    {
      key: 'options',
      header: 'Options',
      width: pixel(80),
      renderCell: (item: RuleRow) => {
        const opts = item.options as Rule['options'];
        return (
          <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
            {opts.secureConnect && <Text size="sm" color="secondary">SC</Text>}
            {opts.machineAuth && <Text size="sm" color="secondary">MA</Text>}
            {opts.stateless && <Text size="sm" color="secondary">SL</Text>}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: pixel(90),
      renderCell: (item: RuleRow) => <Badge label={item.status as string} variant={statusBadgeVariant(item.status as RuleStatus)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: pixel(130),
      renderCell: (item: RuleRow) => (
        <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
          <Button label="Edit" variant="tertiary" size="sm" onClick={() => onEdit(item as unknown as Rule)} />
          <Button label="Delete" variant="tertiary" size="sm" onClick={() => onDelete(item.id)} />
        </div>
      ),
    },
  ], [onEdit, onDelete, onToggleEnabled]);

  return (
    <Table<RuleRow>
      data={sorted}
      columns={columns}
      idKey="id"
      density="compact"
      dividers="rows"
      hasHover
      emptyState={<Text color="secondary">No rules yet. Add a rule to get started.</Text>}
    />
  );
}
