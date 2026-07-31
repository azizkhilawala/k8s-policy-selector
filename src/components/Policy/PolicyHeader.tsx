import {useState, useMemo} from 'react';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import SelectorPowerSearch from '../PolicySelector/SelectorPowerSearch';
import type {Policy, PolicyType, EnforcementMode} from './types';
import type {SelectorValue} from '../PolicySelector/types';

const POLICY_TYPE_OPTIONS = [
  {value: 'organization', label: 'Organization Policy'},
  {value: 'application', label: 'Application Policy'},
];

const ENFORCEMENT_MODE_OPTIONS = [
  {value: 'visibility', label: 'Visibility'},
  {value: 'selective', label: 'Selective'},
  {value: 'full', label: 'Full'},
];

interface PolicyHeaderProps {
  policy: Policy;
  onNameChange: (name: string) => void;
  onTypeChange: (type: PolicyType) => void;
  onEnforcementModeChange: (mode: EnforcementMode) => void;
  onScopeFiltersChange?: (filters: ReadonlyArray<PowerSearchFilter>) => void;
  onSave: () => void;
  isNew?: boolean;
}

export default function PolicyHeader({
  policy,
  onNameChange,
  onTypeChange,
  onEnforcementModeChange,
  onScopeFiltersChange,
  onSave,
  isNew = false,
}: PolicyHeaderProps) {
  const [nameError, setNameError] = useState<string | undefined>();
  const [scopeFilters, setScopeFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);

  const handleNameChange = (v: string) => {
    setNameError(v.trim() === '' ? 'Policy name is required' : undefined);
    onNameChange(v);
  };

  const handleScopeChange = (filters: ReadonlyArray<PowerSearchFilter>) => {
    setScopeFilters(filters);
    onScopeFiltersChange?.(filters);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-4)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-background-surface)',
      }}
    >
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-3)'}}>
        <div style={{flex: 2}}>
          <TextInput
            label="Policy Name"
            value={policy.name}
            onChange={handleNameChange}
            isRequired
            statusMessage={nameError}
            status={nameError ? 'error' : undefined}
          />
        </div>

        <div style={{flex: 1}}>
          <Selector
            label="Policy Type"
            value={policy.type}
            options={POLICY_TYPE_OPTIONS}
            onChange={(v) => onTypeChange(v as PolicyType)}
            isDisabled={!isNew}
          />
        </div>

        {policy.type === 'organization' && (
          <div style={{flex: 1}}>
            <Selector
              label="Enforcement Mode"
              value={policy.enforcementMode ?? 'visibility'}
              options={ENFORCEMENT_MODE_OPTIONS}
              onChange={(v) => onEnforcementModeChange(v as EnforcementMode)}
            />
          </div>
        )}

        <Button
          label="Save Changes"
          variant="primary"
          isDisabled={policy.name.trim() === ''}
          onClick={onSave}
        />
      </div>

      {policy.type === 'application' && (
        <SelectorPowerSearch
          label="Scope"
          side="source"
          filters={scopeFilters}
          onFiltersChange={handleScopeChange}
          environment={policy.environment}
        />
      )}
    </div>
  );
}
