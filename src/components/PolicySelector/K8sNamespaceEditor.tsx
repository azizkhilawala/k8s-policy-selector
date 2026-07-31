import {useState, useEffect} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import {Text} from '@astryxdesign/core/Text';
import type {
  K8sNamespaceMode,
  K8sNamespaceLabelExpression,
  K8sNamespaceLabelOperator,
} from './types';

// ── Serialization ─────────────────────────────────────────────────────────────

export interface K8sNamespaceEditorValue {
  mode: K8sNamespaceMode;
  names: string[];
  labelExpressions: K8sNamespaceLabelExpression[];
}

export function serializeNamespace(v: K8sNamespaceEditorValue): string {
  return JSON.stringify(v);
}

export function deserializeNamespace(s: string | null): K8sNamespaceEditorValue {
  if (!s) return {mode: 'name', names: [], labelExpressions: []};
  try {
    return JSON.parse(s) as K8sNamespaceEditorValue;
  } catch {
    return {mode: 'name', names: [], labelExpressions: []};
  }
}

export function namespaceGetString(value: string): string {
  const v = deserializeNamespace(value);
  switch (v.mode) {
    case 'wildcard': return 'Any namespace';
    case 'intra': return 'Same namespace';
    case 'name': return v.names.length ? v.names.join(', ') : 'No names';
    case 'label': {
      const parts = v.labelExpressions.map(expr => {
        switch (expr.operator) {
          case 'Exists': return `${expr.key} exists`;
          case 'DoesNotExist': return `${expr.key} absent`;
          case 'Equals': return `${expr.key}=${expr.values[0] ?? ''}`;
          case 'In': return `${expr.key} ∈ [${expr.values.join(', ')}]`;
          case 'NotIn': return `${expr.key} ∉ [${expr.values.join(', ')}]`;
        }
      });
      return parts.join(' AND ') || 'Label expression';
    }
  }
}

// ── Suggestions ───────────────────────────────────────────────────────────────

const COMMON_LABEL_KEYS = [
  'kubernetes.io/metadata.name', 'env', 'store', 'region', 'team',
  'tier', 'app', 'version', 'release',
];

const COMMON_LABEL_VALUES: Record<string, string[]> = {
  env: ['production', 'staging', 'development', 'qa', 'dr', 'sandbox'],
  store: ['retail', 'online', 'flagship', 'legacy', 'test'],
  region: ['us-east', 'us-west', 'eu-west', 'ap-southeast'],
  team: ['platform', 'backend', 'frontend', 'data', 'security'],
  tier: ['web', 'api', 'database', 'cache'],
  'kubernetes.io/metadata.name': [
    'default', 'production', 'staging', 'development', 'kube-system',
    'monitoring', 'logging', 'ingress-nginx', 'payments', 'checkout',
  ],
};

export const K8S_NAMESPACE_NAMES = [
  'default', 'kube-system', 'production', 'staging', 'development',
  'qa', 'monitoring', 'logging', 'ingress-nginx', 'payments', 'checkout',
];

const OPERATOR_OPTIONS: {value: K8sNamespaceLabelOperator; label: string}[] = [
  {value: 'In', label: 'In (any of)'},
  {value: 'NotIn', label: 'Not In (none of)'},
  {value: 'Equals', label: '== (exact)'},
  {value: 'Exists', label: 'Exists (key present)'},
  {value: 'DoesNotExist', label: 'Does Not Exist (key absent)'},
];

// ── LabelExpressionRow ────────────────────────────────────────────────────────

function LabelExpressionRow({expr, onChange, onRemove, isDisabled, showRemove}: {
  expr: K8sNamespaceLabelExpression;
  onChange: (e: K8sNamespaceLabelExpression) => void;
  onRemove: () => void;
  isDisabled?: boolean;
  showRemove: boolean;
}) {
  const needsMultiValues = expr.operator === 'In' || expr.operator === 'NotIn';
  const needsSingleValue = expr.operator === 'Equals';
  const valueSuggestions = COMMON_LABEL_VALUES[expr.key] ?? [];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)',
      padding: 'var(--spacing-3)',
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-md)',
      border: '1px solid var(--color-border-default)',
    }}>
      <div style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
        {/* Key — Selector with search */}
        <div style={{flex: 1}}>
          <Selector
            label="Label key"
            value={expr.key}
            options={COMMON_LABEL_KEYS}
            onChange={key => onChange({...expr, key, values: []})}
            hasSearch
            placeholder="Select or type a key…"
            isDisabled={isDisabled}
          />
        </div>

        {/* Operator */}
        <div style={{flexBasis: '180px'}}>
          <Selector
            label="Operator"
            value={expr.operator}
            options={OPERATOR_OPTIONS}
            onChange={op => onChange({...expr, operator: op as K8sNamespaceLabelOperator, values: []})}
            isDisabled={isDisabled}
          />
        </div>

        {showRemove && (
          <Button label="Remove" variant="tertiary" onClick={onRemove} isDisabled={isDisabled} />
        )}
      </div>

      {/* In / NotIn — MultiSelector with badges */}
      {needsMultiValues && (
        <MultiSelector
          label="Values"
          value={expr.values}
          options={valueSuggestions.length > 0 ? valueSuggestions : expr.values}
          onChange={vals => onChange({...expr, values: vals})}
          hasSearch
          hasClear
          triggerDisplay="badges"
          placeholder="Select values…"
          isDisabled={isDisabled}
        />
      )}

      {/* Equals — single Selector */}
      {needsSingleValue && (
        <Selector
          label="Value"
          value={expr.values[0] ?? ''}
          options={valueSuggestions.length > 0 ? valueSuggestions : expr.values}
          onChange={v => onChange({...expr, values: [v]})}
          hasSearch
          hasClear
          placeholder="Select a value…"
          isDisabled={isDisabled}
        />
      )}

      {(expr.operator === 'Exists' || expr.operator === 'DoesNotExist') && (
        <Text size="sm" color="secondary">
          No values needed — checks for key {expr.operator === 'Exists' ? 'presence' : 'absence'} only.
        </Text>
      )}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

interface Props {
  mode: K8sNamespaceMode;
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function K8sNamespaceEditor({mode, isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<K8sNamespaceEditorValue>(() => ({
    ...deserializeNamespace(value),
    mode,
  }));

  useEffect(() => {
    if (mode === 'wildcard' || mode === 'intra') {
      const next = {mode, names: [], labelExpressions: []};
      setState(next);
      onChange(serializeNamespace(next));
    } else if (state.mode !== mode) {
      const next = {...state, mode};
      setState(next);
      onChange(serializeNamespace(next));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (next: K8sNamespaceEditorValue) => {
    setState(next);
    onChange(serializeNamespace(next));
  };

  const addExpression = () =>
    emit({...state, labelExpressions: [...state.labelExpressions, {key: '', operator: 'In', values: []}]});

  const updateExpression = (i: number, expr: K8sNamespaceLabelExpression) =>
    emit({...state, labelExpressions: state.labelExpressions.map((e, idx) => idx === i ? expr : e)});

  const removeExpression = (i: number) =>
    emit({...state, labelExpressions: state.labelExpressions.filter((_, idx) => idx !== i)});

  if (mode === 'wildcard') {
    return (
      <div style={{padding: 'var(--spacing-2)'}}>
        <Text size="sm" color="secondary">
          Matches all namespaces — equivalent to <code>namespaceSelector: {'{}'}</code> in Kubernetes.
        </Text>
      </div>
    );
  }

  if (mode === 'intra') {
    return (
      <div style={{padding: 'var(--spacing-2)'}}>
        <Text size="sm" color="secondary">
          Matches only pods within the same namespace as this policy. No namespace selector is added.
        </Text>
      </div>
    );
  }

  if (mode === 'name') {
    return (
      <div style={{padding: 'var(--spacing-2)'}}>
        <MultiSelector
          label="Namespaces"
          value={state.names}
          options={K8S_NAMESPACE_NAMES}
          onChange={names => emit({...state, names})}
          hasSearch
          hasClear
          triggerDisplay="badges"
          placeholder="Select namespaces…"
          isDisabled={isDisabled}
        />
      </div>
    );
  }

  // mode === 'label'
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', padding: 'var(--spacing-2)'}}>
      {state.labelExpressions.length === 0 && (
        <Text size="sm" color="secondary">Add at least one label expression to match namespaces.</Text>
      )}
      {state.labelExpressions.map((expr, i) => (
        <div key={i}>
          {i > 0 && (
            <div style={{textAlign: 'center', padding: 'var(--spacing-1) 0'}}>
              <Text size="sm" weight="semibold" color="secondary">AND</Text>
            </div>
          )}
          <LabelExpressionRow
            expr={expr}
            onChange={e => updateExpression(i, e)}
            onRemove={() => removeExpression(i)}
            isDisabled={isDisabled}
            showRemove={state.labelExpressions.length > 1}
          />
        </div>
      ))}
      <Button label="+ Add label expression" variant="tertiary" onClick={addExpression} isDisabled={isDisabled} />
    </div>
  );
}
