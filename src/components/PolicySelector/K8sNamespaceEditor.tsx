import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
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

// ── Label suggestions ─────────────────────────────────────────────────────────

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

const OPERATOR_OPTIONS: {value: K8sNamespaceLabelOperator; label: string}[] = [
  {value: 'In', label: 'In (any of)'},
  {value: 'NotIn', label: 'Not In (none of)'},
  {value: 'Equals', label: '== (exact)'},
  {value: 'Exists', label: 'Exists (key present)'},
  {value: 'DoesNotExist', label: 'Does Not Exist (key absent)'},
];

const MODE_OPTIONS: {value: K8sNamespaceMode; label: string}[] = [
  {value: 'name', label: 'By Name'},
  {value: 'label', label: 'By Label'},
  {value: 'wildcard', label: 'Any Namespace'},
  {value: 'intra', label: 'Same Namespace'},
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TagInput({
  values,
  suggestions,
  onChange,
  isDisabled,
}: {
  values: string[];
  suggestions: string[];
  onChange: (v: string[]) => void;
  isDisabled?: boolean;
}) {
  const [input, setInput] = useState('');

  const commit = (raw: string) => {
    const val = raw.trim();
    if (val && !values.includes(val)) onChange([...values, val]);
    setInput('');
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
      {values.length > 0 && (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)'}}>
          {values.map(v => (
            <span
              key={v}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px',
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              {v}
              {!isDisabled && (
                <button
                  aria-label={`Remove ${v}`}
                  onClick={() => onChange(values.filter(x => x !== v))}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--color-text-secondary)', padding: 0, lineHeight: 1,
                  }}
                >×</button>
              )}
            </span>
          ))}
        </div>
      )}
      <TextInput
        label=""
        value={input}
        onChange={setInput}
        placeholder="Type a value and press Enter…"
        isDisabled={isDisabled}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(input); }
        }}
      />
      {suggestions.length > 0 && (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)'}}>
          {suggestions
            .filter(s => !values.includes(s) && (input === '' || s.includes(input)))
            .slice(0, 8)
            .map(s => (
              <button
                key={s}
                onClick={() => onChange([...values, s])}
                disabled={isDisabled}
                style={{
                  padding: '2px 8px',
                  background: 'var(--color-background-tertiary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer', fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function LabelExpressionRow({
  expr,
  onChange,
  onRemove,
  isDisabled,
  showRemove,
}: {
  expr: K8sNamespaceLabelExpression;
  onChange: (e: K8sNamespaceLabelExpression) => void;
  onRemove: () => void;
  isDisabled?: boolean;
  showRemove: boolean;
}) {
  const needsValues = expr.operator === 'In' || expr.operator === 'NotIn' || expr.operator === 'Equals';
  const keySuggestions = COMMON_LABEL_KEYS.filter(k => !expr.key || k.includes(expr.key));
  const valueSuggestions = COMMON_LABEL_VALUES[expr.key] ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
        padding: 'var(--spacing-3)',
        background: 'var(--color-background-secondary)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <div style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
        {/* Key */}
        <div style={{flex: 1}}>
          <TextInput
            label="Label key"
            value={expr.key}
            onChange={key => onChange({...expr, key})}
            placeholder="e.g. env, store, kubernetes.io/metadata.name"
            isDisabled={isDisabled}
          />
          {keySuggestions.length > 0 && expr.key === '' && (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)', marginTop: 'var(--spacing-1)'}}>
              {keySuggestions.slice(0, 6).map(k => (
                <button
                  key={k}
                  onClick={() => onChange({...expr, key: k})}
                  disabled={isDisabled}
                  style={{
                    padding: '2px 8px',
                    background: 'var(--color-background-tertiary)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer', fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
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

      {/* Values — only for In / NotIn / Equals */}
      {needsValues && (
        <div>
          <Text size="sm" color="secondary">
            {expr.operator === 'Equals' ? 'Value' : 'Values'}
          </Text>
          {expr.operator === 'Equals' ? (
            <TextInput
              label=""
              value={expr.values[0] ?? ''}
              onChange={v => onChange({...expr, values: [v]})}
              placeholder="Exact value"
              isDisabled={isDisabled}
            />
          ) : (
            <TagInput
              values={expr.values}
              suggestions={valueSuggestions}
              onChange={values => onChange({...expr, values})}
              isDisabled={isDisabled}
            />
          )}
        </div>
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
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function K8sNamespaceEditor({isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<K8sNamespaceEditorValue>(() => deserializeNamespace(value));

  const emit = (next: K8sNamespaceEditorValue) => {
    setState(next);
    onChange(serializeNamespace(next));
  };

  const setMode = (mode: K8sNamespaceMode) => emit({...state, mode});

  const addExpression = () =>
    emit({
      ...state,
      labelExpressions: [
        ...state.labelExpressions,
        {key: '', operator: 'In', values: []},
      ],
    });

  const updateExpression = (i: number, expr: K8sNamespaceLabelExpression) =>
    emit({
      ...state,
      labelExpressions: state.labelExpressions.map((e, idx) => (idx === i ? expr : e)),
    });

  const removeExpression = (i: number) =>
    emit({
      ...state,
      labelExpressions: state.labelExpressions.filter((_, idx) => idx !== i),
    });

  const K8S_NAMESPACE_NAMES = [
    'default', 'kube-system', 'production', 'staging', 'development',
    'qa', 'monitoring', 'logging', 'ingress-nginx', 'payments', 'checkout',
  ];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {/* Mode selector */}
      <Selector
        label="Selection mode"
        value={state.mode}
        options={MODE_OPTIONS}
        onChange={m => setMode(m as K8sNamespaceMode)}
        isDisabled={isDisabled}
      />

      {/* By Name */}
      {state.mode === 'name' && (
        <TagInput
          values={state.names}
          suggestions={K8S_NAMESPACE_NAMES}
          onChange={names => emit({...state, names})}
          isDisabled={isDisabled}
        />
      )}

      {/* By Label */}
      {state.mode === 'label' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
          {state.labelExpressions.length === 0 && (
            <Text size="sm" color="secondary">
              Add at least one label expression to match namespaces.
            </Text>
          )}
          {state.labelExpressions.map((expr, i) => (
            <div key={i}>
              {i > 0 && (
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  padding: 'var(--spacing-1) 0',
                }}>
                  AND
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
          <Button
            label="+ Add label expression"
            variant="tertiary"
            onClick={addExpression}
            isDisabled={isDisabled}
          />
        </div>
      )}

      {/* Wildcard */}
      {state.mode === 'wildcard' && (
        <Text size="sm" color="secondary">
          Matches all namespaces — equivalent to <code>namespaceSelector: {'{}'}</code> in Kubernetes.
        </Text>
      )}

      {/* Intra-namespace */}
      {state.mode === 'intra' && (
        <Text size="sm" color="secondary">
          Matches only pods within the same namespace as this policy — no namespace selector is added to the expression.
        </Text>
      )}
    </div>
  );
}
