import {useState} from 'react';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import type {SelectorCategory} from './types';

const AWS_REGIONS = [
  'us-east-1','us-east-2','us-west-1','us-west-2',
  'eu-west-1','eu-west-2','eu-central-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1',
].map(r => ({value: r, label: r}));

export type CloudEntry = Record<string, string>;

export interface CloudEditorValue {
  entries: CloudEntry[];
}

export function serializeCloudEditor(v: CloudEditorValue): string {
  return JSON.stringify(v);
}

export function deserializeCloudEditor(s: string | null): CloudEditorValue {
  if (!s) return {entries: [{}]};
  try { return JSON.parse(s) as CloudEditorValue; } catch { return {entries: [{}]}; }
}

// Returns a short display string for the token chip
export function cloudResourceGetString(value: string, category: SelectorCategory): string {
  const parsed = deserializeCloudEditor(value);
  const entry = parsed.entries[0];
  if (!entry) return '';
  const count = parsed.entries.length;
  const suffix = count > 1 ? ` +${count - 1}` : '';
  switch (category) {
    case 'cloud_aws_vpc':
    case 'cloud_aws_subnet':
      return `${entry['id'] ?? ''}${entry['region'] ? ` · ${entry['region']}` : ''}${suffix}`;
    case 'cloud_azure_vnet':
      return `${entry['id'] ?? ''}${entry['resourceGroup'] ? ` · ${entry['resourceGroup']}` : ''}${suffix}`;
    case 'cloud_azure_subnet':
      return `${entry['resourceId'] ?? ''}${suffix}`;
    default:
      return Object.values(entry).filter(Boolean).join(' · ') + suffix;
  }
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'region';
}

const FIELD_DEFS: Partial<Record<SelectorCategory, FieldDef[]>> = {
  cloud_aws_vpc: [
    {key: 'accountId', label: 'Account ID', type: 'text'},
    {key: 'region', label: 'Region', type: 'region'},
    {key: 'id', label: 'VPC ID', type: 'text'},
  ],
  cloud_aws_subnet: [
    {key: 'accountId', label: 'Account ID', type: 'text'},
    {key: 'region', label: 'Region', type: 'region'},
    {key: 'id', label: 'Subnet ID', type: 'text'},
  ],
  cloud_azure_vnet: [
    {key: 'subscriptionId', label: 'Subscription ID', type: 'text'},
    {key: 'resourceGroup', label: 'Resource Group', type: 'text'},
    {key: 'id', label: 'VNet Name', type: 'text'},
  ],
  cloud_azure_subnet: [
    {key: 'resourceId', label: 'Full Azure Resource ID', type: 'text'},
  ],
};

interface Props {
  category: SelectorCategory;
  isDisabled?: boolean;
  onChange: (value: string | null) => void;
  placeholder: string;
  value: string | null;
}

export default function CloudResourceEditor({category, isDisabled, onChange, value}: Props) {
  const [state, setState] = useState<CloudEditorValue>(() => deserializeCloudEditor(value));
  const fields = FIELD_DEFS[category] ?? [];

  const emit = (next: CloudEditorValue) => {
    setState(next);
    onChange(serializeCloudEditor(next));
  };

  const updateEntry = (index: number, key: string, val: string) => {
    const entries = state.entries.map((e, i) => i === index ? {...e, [key]: val} : e);
    emit({entries});
  };

  const addEntry = () => emit({entries: [...state.entries, {}]});
  const removeEntry = (index: number) => emit({entries: state.entries.filter((_, i) => i !== index)});

  const entryLabel = category.includes('vpc') ? 'VPC' :
    category.includes('subnet') ? 'Subnet' :
    category.includes('vnet') ? 'VNet' : 'Entry';

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)'}}>
      {state.entries.map((entry, i) => (
        <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
          {i > 0 && (
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem'}}>{entryLabel} {i + 1}</span>
              <Button label="Remove" variant="tertiary" onClick={() => removeEntry(i)} isDisabled={isDisabled} />
            </div>
          )}
          {fields.map(field => (
            field.type === 'region' ? (
              <Selector
                key={field.key}
                label={field.label}
                value={entry[field.key] ?? ''}
                options={AWS_REGIONS}
                onChange={v => updateEntry(i, field.key, v)}
                isDisabled={isDisabled}
                hasSearch
              />
            ) : (
              <TextInput
                key={field.key}
                label={field.label}
                value={entry[field.key] ?? ''}
                onChange={v => updateEntry(i, field.key, v)}
                isDisabled={isDisabled}
              />
            )
          ))}
        </div>
      ))}
      <Button
        label={`+ Add another ${entryLabel}`}
        variant="tertiary"
        onClick={addEntry}
        isDisabled={isDisabled}
      />
    </div>
  );
}
