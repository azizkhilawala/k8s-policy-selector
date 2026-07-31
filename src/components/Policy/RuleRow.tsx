import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import type {Rule, RuleType, RuleStatus} from './types';

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

function getSelectorLabel(s: {category: string; [key: string]: unknown}): string {
  if ('labels' in s && Array.isArray(s.labels)) return (s.labels as string[]).slice(0, 1).join(', ');
  if ('names' in s && Array.isArray(s.names)) return (s.names as string[]).slice(0, 1).join(', ');
  if ('name' in s && typeof s.name === 'string') return s.name;
  return s.category;
}

export default function RuleRow({rule, onEdit, onDelete, onToggleEnabled}: Props) {
  const sourceLabels = rule.sources.map(s => getSelectorLabel(s as {category: string; [key: string]: unknown}));
  const destLabels = rule.destinations.map(s => getSelectorLabel(s as {category: string; [key: string]: unknown}));
  const serviceLabels = rule.services.map(s => `${s.protocol}:${s.fromPort}-${s.toPort}`);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 100px 1fr 1fr 140px 80px 80px 100px',
      gap: 'var(--spacing-3)',
      alignItems: 'center',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <Badge label={ruleTypeLabel(rule.type)} variant={ruleTypeBadgeVariant(rule.type)} />
      <Text size="sm" color="secondary">{rule.scopeType === 'intra' ? 'Intra-scope' : 'Extra-scope'}</Text>
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
