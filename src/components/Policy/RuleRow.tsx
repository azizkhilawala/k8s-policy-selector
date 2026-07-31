import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
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

interface Props {
  rule: Rule;
  rowNumber: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
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

export default function RuleRow({rule, rowNumber, onEdit, onDelete, onToggleEnabled}: Props) {
  const sourceLabels = rule.sources.flatMap(s => getSelectorLabels(s));
  const destLabels = rule.destinations.flatMap(s => getSelectorLabels(s));
  const serviceLabels = rule.services.map(s =>
    s.fromPort === s.toPort
      ? `${s.protocol} ${s.fromPort}`
      : `${s.protocol} ${s.fromPort}-${s.toPort}`,
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '0.3fr 0.8fr 0.7fr 0.5fr 1.5fr 1.5fr 1.2fr 0.6fr 0.6fr 0.8fr',
      gap: 'var(--spacing-3)',
      alignItems: 'center',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
      opacity: rule.enabled ? 1 : 0.5,
    }}>
      <Text size="sm" color="secondary">{rowNumber}</Text>
      <Badge label={ruleTypeLabel(rule.type)} variant={ruleTypeBadgeVariant(rule.type)} />
      <Text size="sm" color="secondary">{rule.scopeType === 'intra' ? 'Intra-scope' : 'Extra-scope'}</Text>
      <Button
        label={rule.enabled ? 'On' : 'Off'}
        variant="tertiary"
        size="sm"
        onClick={() => onToggleEnabled(!rule.enabled)}
      />
      <TokenPills items={sourceLabels.length > 0 ? sourceLabels : ['Any']} />
      <TokenPills items={destLabels.length > 0 ? destLabels : ['Any']} />
      <TokenPills items={serviceLabels.length > 0 ? serviceLabels : ['Any']} max={2} />
      <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
        {rule.options.secureConnect && <Text size="xs" color="secondary">SC</Text>}
        {rule.options.machineAuth && <Text size="xs" color="secondary">MA</Text>}
        {rule.options.stateless && <Text size="xs" color="secondary">SL</Text>}
      </div>
      <Badge label={rule.status} variant={statusBadgeVariant(rule.status)} />
      <div style={{display: 'flex', gap: 'var(--spacing-1)'}}>
        <Button label="Edit" variant="tertiary" size="sm" onClick={onEdit} />
        <Button label="Delete" variant="tertiary" size="sm" onClick={onDelete} />
      </div>
    </div>
  );
}
