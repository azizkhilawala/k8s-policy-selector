import {useState, useCallback} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Tokenizer} from '@astryxdesign/core/Tokenizer';
import {Token} from '@astryxdesign/core/Token';
import type {K8sExpression, K8sOperator} from './types';

export interface K8sEditorValue {
  expressions: K8sExpression[];
}

export function serializeK8sEditor(v: K8sEditorValue): string {
  return JSON.stringify(v);
}

export function deserializeK8sEditor(s: string | null): K8sEditorValue {
  if (!s) return {expressions: [{key: '', operator: 'eq', values: ['']}]};
  try {
    const parsed = JSON.parse(s) as K8sEditorValue;
    return parsed;
  } catch {
    return {expressions: [{key: '', operator: 'eq', values: ['']}]};
  }
}

export function k8sEditorGetString(value: string): string {
  const parsed = deserializeK8sEditor(value);
  return parsed.expressions
    .filter(e => e.key.trim() !== '')
    .map(expr => {
      if (expr.operator === 'exists') return `${expr.key}=*`;
      if (expr.operator === 'notexists') return `!${expr.key}`;
      if (expr.operator === 'eq') return `${expr.key}=${expr.values[0] ?? ''}`;
      if (expr.operator === 'neq') return `${expr.key}!=${expr.values[0] ?? ''}`;
      if (expr.operator === 'in') return `${expr.key} in [${expr.values.join(',')}]`;
      if (expr.operator === 'notin') return `${expr.key} notin [${expr.values.join(',')}]`;
      return expr.key;
    })
    .join(' & ') || '(empty)';
}

const OPERATOR_OPTIONS = [
  {value: 'eq', label: '= equals'},
  {value: 'exists', label: '=* exists'},
  {value: 'neq', label: '!= not equals'},
  {value: 'in', label: 'in set'},
  {value: 'notin', label: 'notin set'},
  {value: 'notexists', label: '! does not exist'},
];

const EMPTY_EXPRESSION: K8sExpression = {key: '', operator: 'eq', values: ['']};
const MULTI_VALUE_OPS: K8sOperator[] = ['in', 'notin'];
const NO_VALUE_OPS: K8sOperator[] = ['exists', 'notexists'];

interface Props {
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function K8sExpressionEditor({isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<K8sEditorValue>(() => deserializeK8sEditor(value));

  const emit = useCallback((next: K8sEditorValue) => {
    setState(next);
    onChange(serializeK8sEditor(next));
  }, [onChange]);

  const updateExpression = (index: number, patch: Partial<K8sExpression>) => {
    const expressions = state.expressions.map((e, i) => {
      if (i !== index) return e;
      const updated = {...e, ...patch};
      if (patch.operator !== undefined) {
        if (NO_VALUE_OPS.includes(patch.operator)) updated.values = [];
        else if (MULTI_VALUE_OPS.includes(patch.operator)) updated.values = [];
        else updated.values = [''];
      }
      return updated;
    });
    emit({...state, expressions});
  };

  const addExpression = () =>
    emit({...state, expressions: [...state.expressions, {...EMPTY_EXPRESSION}]});

  const removeExpression = (index: number) =>
    emit({...state, expressions: state.expressions.filter((_, i) => i !== index)});

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {state.expressions.map((expr, i) => (
        <div key={i}>
          {i > 0 && (
            <div style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: 'var(--spacing-1)'}}>
              — AND —
            </div>
          )}
          <div style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
            <TextInput
              label="Key"
              value={expr.key}
              onChange={v => updateExpression(i, {key: v})}
              placeholder="e.g. app, env, tier"
              isDisabled={isDisabled}
              style={{flex: 1}}
            />
            <Selector
              label="Operator"
              value={expr.operator}
              options={OPERATOR_OPTIONS}
              onChange={op => updateExpression(i, {operator: op as K8sOperator})}
              isDisabled={isDisabled}
              style={{width: '140px'}}
            />
            {!NO_VALUE_OPS.includes(expr.operator) && (
              MULTI_VALUE_OPS.includes(expr.operator) ? (
                <Tokenizer
                  label="Values"
                  value={expr.values.filter(Boolean).map(v => ({id: v, label: v}))}
                  searchSource={{search: () => [], bootstrap: () => []}}
                  hasCreate
                  onChange={(items) => updateExpression(i, {values: items.map(it => it.label)})}
                  isDisabled={isDisabled}
                  renderToken={(item, onRemove) => (
                    <Token key={item.id} label={item.label} onRemove={onRemove} />
                  )}
                  style={{flex: 1}}
                />
              ) : (
                <TextInput
                  label="Value"
                  value={expr.values[0] ?? ''}
                  onChange={v => updateExpression(i, {values: [v]})}
                  placeholder="label value"
                  isDisabled={isDisabled}
                  style={{flex: 1}}
                />
              )
            )}
            {state.expressions.length > 1 && (
              <Button
                label="Remove"
                variant="tertiary"
                onClick={() => removeExpression(i)}
                isDisabled={isDisabled}
              />
            )}
          </div>
        </div>
      ))}

      <Button
        label="+ Add expression"
        variant="tertiary"
        onClick={addExpression}
        isDisabled={isDisabled}
      />
    </div>
  );
}
