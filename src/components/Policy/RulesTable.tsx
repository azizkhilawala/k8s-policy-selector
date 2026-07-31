import {useMemo} from 'react';
import {Text} from '@astryxdesign/core/Text';
import RuleRow from './RuleRow';
import {RULE_TYPE_ORDER} from '../../stores/policyStore';
import type {Rule} from './types';

interface RulesTableProps {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
  onToggleEnabled: (ruleId: string, enabled: boolean) => void;
}

export default function RulesTable({rules, onEdit, onDelete, onToggleEnabled}: RulesTableProps): JSX.Element {
  const sorted = useMemo(
    () => [...rules].sort((a, b) => RULE_TYPE_ORDER[a.type] - RULE_TYPE_ORDER[b.type]),
    [rules],
  );

  if (rules.length === 0) {
    return (
      <div style={{padding: 'var(--spacing-8)', textAlign: 'center'}}>
        <Text color="secondary">No rules yet. Add a rule to get started.</Text>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 0.8fr 1.5fr 1.5fr 1.2fr 0.6fr 0.6fr 0.8fr',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        borderBottom: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-background-secondary)',
      }}>
        {['Type', 'Scope', 'Sources', 'Destinations', 'Services', 'Options', 'Status', 'Actions'].map(h => (
          <Text key={h} size="sm" weight="semibold" color="secondary">{h}</Text>
        ))}
      </div>

      {sorted.map(rule => (
        <RuleRow
          key={rule.id}
          rule={rule}
          onEdit={() => onEdit(rule)}
          onDelete={() => onDelete(rule.id)}
          onToggleEnabled={enabled => onToggleEnabled(rule.id, enabled)}
        />
      ))}
    </div>
  );
}
