import {useState, useMemo} from 'react';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import SelectorPowerSearch from './SelectorPowerSearch';
import RuleOptionsSelector from './RuleOptionsSelector';
import {buildPortRangeConfig} from './selectorConfig';
import type {RuleFormValue, RuleOption} from './types';
import type {Persona, Environment} from '../Policy/types';

const ALL_RULE_TYPE_OPTIONS = [
  {value: 'allow', label: 'Allow Rule'},
  {value: 'deny', label: 'Deny Rule'},
  {value: 'override_deny', label: 'Override Deny Rule'},
];

const SCOPE_TYPE_OPTIONS = [
  {value: 'intra_scope', label: 'Intra-Scope'},
  {value: 'extra_scope', label: 'Extra-Scope'},
];

interface Props {
  onSave: (value: RuleFormValue) => void;
  onCancel: () => void;
  initialValue?: RuleFormValue;
  environment?: Environment;
  persona?: Persona;
}

export default function AddRulePanel({onSave, onCancel, initialValue, environment = 'containers', persona = 'admin'}: Props) {
  const isEditMode = initialValue != null;

  const [ruleType, setRuleType] = useState<RuleFormValue['ruleType']>(initialValue?.ruleType ?? 'allow');
  const [sourceScopeType, setSourceScopeType] = useState<RuleFormValue['sourceScopeType']>(initialValue?.sourceScopeType ?? 'intra_scope');
  const [sourceFilters, setSourceFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [sourceProcessFilters, setSourceProcessFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [destinationFilters, setDestinationFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [portRangeFilters, setPortRangeFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [ruleOptions, setRuleOptions] = useState<RuleOption[]>(initialValue?.ruleOptions ?? []);

  const ruleTypeOptions = persona === 'app_owner'
    ? ALL_RULE_TYPE_OPTIONS.filter(o => o.value === 'allow')
    : ALL_RULE_TYPE_OPTIONS;

  const sourceProcessConfig = useMemo(() => buildPortRangeConfig(), []);
  const portRangeConfig = useMemo(() => buildPortRangeConfig(), []);

  const handleSave = () => {
    onSave({
      ruleType,
      sourceScopeType,
      sources: [],
      sourceClusters: [],
      sourceProcessServices: [],
      destinations: [],
      destinationClusters: [],
      destinationServices: [],
      ruleOptions,
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '776px',
      height: '100%',
      backgroundColor: 'var(--color-background-surface)',
      borderLeft: '1px solid var(--color-border)',
    }}>
      {/* Header */}
      <div style={{padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)'}}>
        <Text weight="bold" size="lg">{isEditMode ? 'Edit Rule' : 'Add Rule'}</Text>
      </div>

      {/* Body */}
      <div style={{flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>

        <Selector
          label="Rule Type"
          value={ruleType}
          options={ruleTypeOptions}
          onChange={v => setRuleType(v as RuleFormValue['ruleType'])}
          isRequired
        />

        <Selector
          label="Source Scope Type"
          value={sourceScopeType}
          options={SCOPE_TYPE_OPTIONS}
          onChange={v => setSourceScopeType(v as RuleFormValue['sourceScopeType'])}
          isRequired
        />

        <SelectorPowerSearch
          label="Sources"
          side="source"
          filters={sourceFilters}
          onFiltersChange={setSourceFilters}
          isRequired
          environment={environment}
        />

        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
          <Text size="sm" weight="medium">Source Process / Service</Text>
          <PowerSearch
            label="Source Process / Service"
            config={sourceProcessConfig}
            filters={sourceProcessFilters}
            onChange={f => setSourceProcessFilters([...f])}
            placeholder="Select Source Process / Service..."
          />
        </div>

        <SelectorPowerSearch
          label="Destinations"
          side="destination"
          filters={destinationFilters}
          onFiltersChange={setDestinationFilters}
          isRequired
          environment={environment}
        />

        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
          <div style={{display: 'flex', gap: 'var(--spacing-1)', alignItems: 'center'}}>
            <Text size="sm" color="critical">*</Text>
            <Text size="sm" weight="medium">Destination Services</Text>
          </div>
          <PowerSearch
            label="Destination Services"
            config={portRangeConfig}
            filters={portRangeFilters}
            onChange={f => setPortRangeFilters([...f])}
            placeholder="Select Destination Services..."
            isRequired
          />
        </div>

        <RuleOptionsSelector value={ruleOptions} onChange={setRuleOptions} />
      </div>

      {/* Footer */}
      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-2)',
      }}>
        <Button label="Cancel" variant="secondary" onClick={onCancel} />
        <Button label={isEditMode ? 'Update Rule' : 'Save'} variant="primary" onClick={handleSave} />
      </div>
    </div>
  );
}
