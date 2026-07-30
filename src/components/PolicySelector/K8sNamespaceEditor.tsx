import {useState, useRef, useEffect} from 'react';
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

// ── Dropdown — escapes overflow:hidden via position:fixed ─────────────────────

interface DropdownProps {
  items: string[];
  onSelect: (v: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

function Dropdown({items, onSelect, anchorRef}: DropdownProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
  }, [anchorRef]);

  if (!rect || items.length === 0) return null;

  return (
    <ul
      style={{
        position: 'fixed',
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        margin: 0,
        padding: 0,
        listStyle: 'none',
        background: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--border-radius-md)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        maxHeight: '220px',
        overflowY: 'auto',
      }}
    >
      {items.map(s => (
        <li
          key={s}
          onMouseDown={() => onSelect(s)}
          style={{padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-primary)'}}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-background-secondary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

// ── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({values, suggestions, onChange, isDisabled}: {
  values: string[];
  suggestions: string[];
  onChange: (v: string[]) => void;
  isDisabled?: boolean;
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const commit = (raw: string) => {
    const val = raw.trim();
    if (val && !values.includes(val)) onChange([...values, val]);
    setInput('');
    setOpen(false);
  };

  const filtered = suggestions.filter(
    s => !values.includes(s) && (input === '' || s.toLowerCase().includes(input.toLowerCase())),
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
      {values.length > 0 && (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)'}}>
          {values.map(v => (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px',
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.8125rem', color: 'var(--color-text-primary)',
            }}>
              {v}
              {!isDisabled && (
                <button
                  aria-label={`Remove ${v}`}
                  onClick={() => onChange(values.filter(x => x !== v))}
                  style={{border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0, lineHeight: 1}}
                >×</button>
              )}
            </span>
          ))}
        </div>
      )}
      <div ref={wrapRef}>
        <TextInput
          label=""
          value={input}
          onChange={v => { setInput(v); setOpen(true); }}
          placeholder="Type or select a value…"
          isDisabled={isDisabled}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(input); }
            if (e.key === 'Escape') setOpen(false);
          }}
        />
        {open && <Dropdown items={filtered} onSelect={commit} anchorRef={wrapRef} />}
      </div>
    </div>
  );
}

// ── KeyInput ──────────────────────────────────────────────────────────────────

function KeyInput({value, suggestions, onChange, isDisabled}: {
  value: string;
  suggestions: string[];
  onChange: (v: string) => void;
  isDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(
    s => value === '' || s.toLowerCase().includes(value.toLowerCase()),
  );

  return (
    <div ref={wrapRef}>
      <TextInput
        label="Label key"
        value={value}
        onChange={v => { onChange(v); setOpen(true); }}
        placeholder="e.g. env, store, kubernetes.io/metadata.name"
        isDisabled={isDisabled}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }}
      />
      {open && <Dropdown items={filtered} onSelect={v => { onChange(v); setOpen(false); }} anchorRef={wrapRef} />}
    </div>
  );
}

// ── LabelExpressionRow ────────────────────────────────────────────────────────

function LabelExpressionRow({expr, onChange, onRemove, isDisabled, showRemove}: {
  expr: K8sNamespaceLabelExpression;
  onChange: (e: K8sNamespaceLabelExpression) => void;
  onRemove: () => void;
  isDisabled?: boolean;
  showRemove: boolean;
}) {
  const needsValues = expr.operator === 'In' || expr.operator === 'NotIn' || expr.operator === 'Equals';
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
        <div style={{flex: 1}}>
          <KeyInput
            value={expr.key}
            suggestions={COMMON_LABEL_KEYS}
            onChange={key => onChange({...expr, key})}
            isDisabled={isDisabled}
          />
        </div>
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

      {needsValues && (
        <div>
          <Text size="sm" color="secondary">{expr.operator === 'Equals' ? 'Value' : 'Values'}</Text>
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
              onChange={vals => onChange({...expr, values: vals})}
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

// ── Main editor — mode is passed in as a locked prop from selectorConfig ───────

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
    mode, // lock to the operator's mode
  }));

  // Keep mode in sync if the operator changes while an existing value is present
  useEffect(() => {
    if (state.mode !== mode) {
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
        <TagInput
          values={state.names}
          suggestions={K8S_NAMESPACE_NAMES}
          onChange={names => emit({...state, names})}
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
            <div style={{textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', padding: 'var(--spacing-1) 0'}}>
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
      <Button label="+ Add label expression" variant="tertiary" onClick={addExpression} isDisabled={isDisabled} />
    </div>
  );
}
