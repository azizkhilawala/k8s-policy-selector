import {useState, useCallback} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {Text} from '@astryxdesign/core/Text';
import type {IllumioDimension, IllumioLabelEntry} from './types';

// Example values per dimension — realistic Illumio PCE label taxonomy
const DIMENSION_VALUES: Record<IllumioDimension, string[]> = {
  role: ['web', 'api', 'database', 'cache', 'worker', 'queue', 'proxy', 'monitoring'],
  app: ['frontend', 'backend', 'auth-service', 'payment', 'inventory', 'notification', 'analytics', 'search'],
  env: ['Production', 'Staging', 'Development', 'QA', 'DR', 'Sandbox'],
  loc: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'datacenter-nyc', 'datacenter-london'],
};

const DIMENSION_OPTIONS: {value: IllumioDimension; label: string}[] = [
  {value: 'role', label: 'Role'},
  {value: 'app', label: 'Application'},
  {value: 'env', label: 'Environment'},
  {value: 'loc', label: 'Location'},
];

export interface IllumioEditorValue {
  labels: IllumioLabelEntry[];
}

export function serializeIllumioEditor(v: IllumioEditorValue): string {
  return JSON.stringify(v);
}

export function deserializeIllumioEditor(s: string | null): IllumioEditorValue {
  if (!s) return {labels: [{dimension: 'role', value: ''}]};
  try {
    return JSON.parse(s) as IllumioEditorValue;
  } catch {
    return {labels: [{dimension: 'role', value: ''}]};
  }
}

export function illumioEditorGetString(value: string): string {
  const parsed = deserializeIllumioEditor(value);
  const parts = parsed.labels
    .filter(l => l.value.trim() !== '')
    .map(l => {
      const dim = DIMENSION_OPTIONS.find(d => d.value === l.dimension);
      return `${dim?.label ?? l.dimension}:${l.value}`;
    });
  return parts.join(', ') || '(empty)';
}

const EMPTY_LABEL: IllumioLabelEntry = {dimension: 'role', value: ''};

interface Props {
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function IllumioLabelEditor({isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<IllumioEditorValue>(() => deserializeIllumioEditor(value));

  const emit = useCallback((next: IllumioEditorValue) => {
    setState(next);
    onChange(serializeIllumioEditor(next));
  }, [onChange]);

  const updateLabel = (index: number, patch: Partial<IllumioLabelEntry>) => {
    const labels = state.labels.map((l, i) => {
      if (i !== index) return l;
      const updated = {...l, ...patch};
      // Reset value when dimension changes
      if (patch.dimension !== undefined && patch.dimension !== l.dimension) {
        updated.value = '';
      }
      return updated;
    });
    emit({labels});
  };

  const addLabel = () => emit({labels: [...state.labels, {...EMPTY_LABEL}]});

  const removeLabel = (index: number) =>
    emit({labels: state.labels.filter((_, i) => i !== index)});

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {state.labels.map((label, i) => {
        const valueOptions = DIMENSION_VALUES[label.dimension].map(v => ({value: v, label: v}));
        return (
          <div key={i}>
            {i > 0 && (
              <div style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: 'var(--spacing-1)'}}>
                — AND —
              </div>
            )}
            <div style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
              <Selector
                label="Dimension"
                value={label.dimension}
                options={DIMENSION_OPTIONS}
                onChange={d => updateLabel(i, {dimension: d as IllumioDimension})}
                isDisabled={isDisabled}
                style={{width: '140px'}}
              />
              <Selector
                label="Value"
                value={label.value}
                options={valueOptions}
                onChange={v => updateLabel(i, {value: v})}
                isDisabled={isDisabled}
                style={{flex: 1}}
                placeholder="Select a value..."
              />
              {state.labels.length > 1 && (
                <Button
                  label="Remove"
                  variant="tertiary"
                  onClick={() => removeLabel(i)}
                  isDisabled={isDisabled}
                />
              )}
            </div>
          </div>
        );
      })}

      <Text size="sm" color="secondary">
        Examples: Role:web, App:frontend, Env:Production, Loc:us-east-1
      </Text>

      <Button
        label="+ Add label"
        variant="tertiary"
        onClick={addLabel}
        isDisabled={isDisabled}
      />
    </div>
  );
}
