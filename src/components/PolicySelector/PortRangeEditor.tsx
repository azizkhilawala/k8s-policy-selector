import {useState} from 'react';
import {Selector} from '@astryxdesign/core/Selector';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Button} from '@astryxdesign/core/Button';
import type {PortRange} from './types';

export interface PortRangeEditorValue {
  ranges: PortRange[];
}

export function serializePortRange(v: PortRangeEditorValue): string {
  return JSON.stringify(v);
}

export function deserializePortRange(s: string | null): PortRangeEditorValue {
  if (!s) return {ranges: [{protocol: 'TCP', fromPort: 0, toPort: 0}]};
  try { return JSON.parse(s) as PortRangeEditorValue; } catch {
    return {ranges: [{protocol: 'TCP', fromPort: 0, toPort: 0}]};
  }
}

export function portRangeGetString(value: string): string {
  const parsed = deserializePortRange(value);
  return parsed.ranges.map(r =>
    r.fromPort === r.toPort
      ? `${r.protocol} ${r.fromPort}`
      : `${r.protocol} ${r.fromPort}–${r.toPort}`,
  ).join(', ');
}

const PROTOCOL_OPTIONS = [
  {value: 'TCP', label: 'TCP'},
  {value: 'UDP', label: 'UDP'},
];

interface Props {
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function PortRangeEditor({isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<PortRangeEditorValue>(() => deserializePortRange(value));

  const emit = (next: PortRangeEditorValue) => {
    setState(next);
    onChange(serializePortRange(next));
  };

  const updateRange = (index: number, patch: Partial<PortRange>) => {
    emit({ranges: state.ranges.map((r, i) => i === index ? {...r, ...patch} : r)});
  };

  const addRange = () =>
    emit({ranges: [...state.ranges, {protocol: 'TCP', fromPort: 0, toPort: 0}]});

  const removeRange = (index: number) =>
    emit({ranges: state.ranges.filter((_, i) => i !== index)});

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {state.ranges.map((range, i) => (
        <div key={i} style={{display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-end'}}>
          <Selector
            label="Protocol"
            value={range.protocol}
            options={PROTOCOL_OPTIONS}
            onChange={v => updateRange(i, {protocol: v as 'TCP' | 'UDP'})}
            isDisabled={isDisabled}
            style={{width: 100}}
          />
          <NumberInput
            label="From port"
            value={range.fromPort}
            onChange={v => updateRange(i, {fromPort: v ?? 0})}
            min={0}
            max={65535}
            isDisabled={isDisabled}
          />
          <NumberInput
            label="To port"
            value={range.toPort}
            onChange={v => updateRange(i, {toPort: v ?? 0})}
            min={0}
            max={65535}
            isDisabled={isDisabled}
          />
          {state.ranges.length > 1 && (
            <Button label="Remove" variant="tertiary" onClick={() => removeRange(i)} isDisabled={isDisabled} />
          )}
        </div>
      ))}
      <Button label="+ Add another range" variant="tertiary" onClick={addRange} isDisabled={isDisabled} />
    </div>
  );
}
