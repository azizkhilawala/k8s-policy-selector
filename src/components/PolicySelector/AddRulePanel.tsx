import {useState, useMemo} from 'react';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import SelectorPowerSearch from './SelectorPowerSearch';
import RuleOptionsSelector from './RuleOptionsSelector';
import {buildPortRangeConfig} from './selectorConfig';
import type {RuleFormValue, ClusterRef, RuleOption} from './types';

const RULE_TYPE_OPTIONS = [
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
}

export default function AddRulePanel({onSave, onCancel}: Props) {
  const [ruleType, setRuleType] = useState<RuleFormValue['ruleType']>('allow');
  const [sourceScopeType, setSourceScopeType] = useState<RuleFormValue['sourceScopeType']>('intra_scope');
  const [sourceFilters, setSourceFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [sourceClusters, setSourceClusters] = useState<ClusterRef[]>([]);
  const [destinationFilters, setDestinationFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [destinationClusters, setDestinationClusters] = useState<ClusterRef[]>([]);
  const [portRangeFilters, setPortRangeFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [ruleOptions, setRuleOptions] = useState<RuleOption[]>([]);

  const portRangeConfig = useMemo(() => buildPortRangeConfig(), []);

  const handleSave = () => {
    onSave({
      ruleType,
      sourceScopeType,
      sources: [],        // parent maps filters → SelectorValue
      sourceClusters,
      destinations: [],
      destinationClusters,
      destinationServices: [],
      ruleOptions,
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: 776,
      height: '100vh',
      backgroundColor: 'var(--color-background-surface)',
      borderLeft: '1px solid var(--color-border)',
    }}>
      {/* Header */}
      <div style={{padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)'}}>
        <Text weight="bold" size="lg">Add Rule</Text>
      </div>

      {/* Body */}
      <div style={{flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)'}}>
        <Selector
          label="* Rule Type"
          value={ruleType}
          options={RULE_TYPE_OPTIONS}
          onChange={v => setRuleType(v as RuleFormValue['ruleType'])}
          isRequired
        />

        <Selector
          label="* Source Scope Type"
          value={sourceScopeType}
          options={SCOPE_TYPE_OPTIONS}
          onChange={v => setSourceScopeType(v as RuleFormValue['sourceScopeType'])}
          isRequired
        />

        <SelectorPowerSearch
          label="Sources"
          side="source"
          filters={sourceFilters}
          clusters={sourceClusters}
          onFiltersChange={setSourceFilters}
          onClustersChange={setSourceClusters}
          isRequired
        />

        <SelectorPowerSearch
          label="Destinations"
          side="destination"
          filters={destinationFilters}
          clusters={destinationClusters}
          onFiltersChange={setDestinationFilters}
          onClustersChange={setDestinationClusters}
          isRequired
        />

        <PowerSearch
          label="* Destination Services"
          config={portRangeConfig}
          filters={portRangeFilters}
          onChange={f => setPortRangeFilters([...f])}
          placeholder="Add port range..."
          isRequired
        />

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
        <Button label="Save" variant="primary" onClick={handleSave} />
      </div>
    </div>
  );
}
