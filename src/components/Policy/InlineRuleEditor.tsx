import {useState, useMemo} from 'react';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import SelectorPowerSearch from '../PolicySelector/SelectorPowerSearch';
import RuleOptionsSelector from '../PolicySelector/RuleOptionsSelector';
import {buildPortRangeConfig} from '../PolicySelector/selectorConfig';
import {deserializePortRange} from '../PolicySelector/PortRangeEditor';
import {deserializeCloudEditor} from '../PolicySelector/CloudResourceEditor';
import {deserializeNamespace} from '../PolicySelector/K8sNamespaceEditor';
import type {RuleFormValue, RuleOption, SelectorValue, PortRange} from '../PolicySelector/types';
import type {Rule, Environment, Persona} from './types';

function extractStrings(fv: PowerSearchFilter['value']): string[] {
  if (fv.type === 'string') return [fv.value];
  if (fv.type === 'string_list') return [...fv.value];
  if (fv.type === 'custom') return [fv.value];
  return [];
}

function convertFiltersToSelectorValues(filters: ReadonlyArray<PowerSearchFilter>): SelectorValue[] {
  const grouped = new Map<string, string[]>();
  for (const f of filters) {
    const vals = extractStrings(f.value);
    if (vals.length === 0) continue;
    const existing = grouped.get(f.field) ?? [];
    existing.push(...vals);
    grouped.set(f.field, existing);
  }

  const result: SelectorValue[] = [];
  for (const [fieldKey, values] of grouped) {
    switch (fieldKey) {
      case 'k8s_labels': result.push({category: 'k8s_labels', labels: values}); break;
      case 'illumio_labels': result.push({category: 'illumio_labels', labels: values}); break;
      case 'k8s_cluster': result.push({category: 'k8s_cluster', clusterNames: values}); break;
      case 'k8s_service_account': result.push({category: 'k8s_service_account', serviceAccounts: values}); break;
      case 'ip_list': result.push({category: 'ip_list', ids: values}); break;
      case 'fqdn': result.push({category: 'fqdn', names: values}); break;
      case 'k8s_service': result.push({category: 'k8s_service', names: values}); break;
      case 'k8s_ingress': result.push({category: 'k8s_ingress', names: values}); break;
      case 'k8s_gateway': result.push({category: 'k8s_gateway', names: values}); break;
      case 'cloud_aws_account': result.push({category: 'cloud_aws_account', accountIds: values}); break;
      case 'cloud_azure_subscription': result.push({category: 'cloud_azure_subscription', subscriptionIds: values}); break;
      case 'k8s_namespace': {
        const parsed = deserializeNamespace(values[0]);
        result.push({category: 'k8s_namespace', mode: parsed.mode, names: parsed.names, labelExpressions: parsed.labelExpressions});
        break;
      }
      case 'cloud_aws_vpc': {
        const p = deserializeCloudEditor(values[0]);
        result.push({category: 'cloud_aws_vpc', vpcs: p.entries.map(e => ({id: e['id'] ?? '', accountId: e['accountId'] ?? '', region: e['region'] ?? ''}))});
        break;
      }
      case 'cloud_aws_subnet': {
        const p = deserializeCloudEditor(values[0]);
        result.push({category: 'cloud_aws_subnet', subnets: p.entries.map(e => ({id: e['id'] ?? '', accountId: e['accountId'] ?? '', region: e['region'] ?? ''}))});
        break;
      }
      case 'cloud_azure_vnet': {
        const p = deserializeCloudEditor(values[0]);
        result.push({category: 'cloud_azure_vnet', vnets: p.entries.map(e => ({id: e['id'] ?? '', resourceGroup: e['resourceGroup'] ?? '', subscriptionId: e['subscriptionId'] ?? ''}))});
        break;
      }
      case 'cloud_azure_subnet': {
        const p = deserializeCloudEditor(values[0]);
        result.push({category: 'cloud_azure_subnet', resourceIds: p.entries.map(e => e['resourceId'] ?? '').filter(Boolean)});
        break;
      }
    }
  }
  return result;
}

function convertFiltersToPortRanges(filters: ReadonlyArray<PowerSearchFilter>): PortRange[] {
  const ranges: PortRange[] = [];
  for (const f of filters) {
    for (const v of extractStrings(f.value)) {
      const parsed = deserializePortRange(v);
      ranges.push(...parsed.ranges.filter(r => r.fromPort > 0 || r.toPort > 0));
    }
  }
  return ranges;
}

const RULE_TYPE_OPTIONS = [
  {value: 'allow', label: 'Allow'},
  {value: 'deny', label: 'Deny'},
  {value: 'override_deny', label: 'Override Deny'},
];

const SCOPE_TYPE_OPTIONS = [
  {value: 'intra_scope', label: 'Intra-Scope'},
  {value: 'extra_scope', label: 'Extra-Scope'},
];

interface Props {
  onSave: (value: RuleFormValue) => void;
  onCancel: () => void;
  editingRule?: Rule;
  environment: Environment;
  persona?: Persona;
}

export default function InlineRuleEditor({onSave, onCancel, editingRule, environment, persona = 'admin'}: Props) {
  const isEdit = editingRule != null;

  const [ruleType, setRuleType] = useState<RuleFormValue['ruleType']>(editingRule?.type ?? 'allow');
  const [scopeType, setScopeType] = useState<RuleFormValue['sourceScopeType']>(
    editingRule ? (editingRule.scopeType === 'intra' ? 'intra_scope' : 'extra_scope') : 'intra_scope',
  );
  const [sourceFilters, setSourceFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [sourceProcessFilters, setSourceProcessFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [destinationFilters, setDestinationFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [portRangeFilters, setPortRangeFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [ruleOptions, setRuleOptions] = useState<RuleOption[]>([]);
  const [expanded, setExpanded] = useState(true);

  const ruleTypeOpts = persona === 'app_owner'
    ? RULE_TYPE_OPTIONS.filter(o => o.value === 'allow')
    : RULE_TYPE_OPTIONS;

  const portRangeConfig = useMemo(() => buildPortRangeConfig(), []);

  const handleSave = () => {
    onSave({
      ruleType,
      sourceScopeType: scopeType,
      sources: convertFiltersToSelectorValues(sourceFilters),
      sourceClusters: [],
      sourceProcessServices: convertFiltersToPortRanges(sourceProcessFilters),
      destinations: convertFiltersToSelectorValues(destinationFilters),
      destinationClusters: [],
      destinationServices: convertFiltersToPortRanges(portRangeFilters),
      ruleOptions,
    });
  };

  return (
    <div style={{
      border: '2px solid var(--color-border-active)',
      borderRadius: 'var(--border-radius-md)',
      margin: 'var(--spacing-2) var(--spacing-4)',
      backgroundColor: 'var(--color-background-surface)',
    }}>
      {/* Inline row — simple fields */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-3) var(--spacing-4)',
        borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
      }}>
        <Text size="sm" weight="semibold" color="secondary">{isEdit ? 'Edit' : 'New'}</Text>

        <div style={{flex: '0 0 auto', minWidth: 'var(--spacing-32)'}}>
          <Selector
            label="Type"
            value={ruleType}
            options={ruleTypeOpts}
            onChange={v => setRuleType(v as RuleFormValue['ruleType'])}
          />
        </div>

        <div style={{flex: '0 0 auto', minWidth: 'var(--spacing-32)'}}>
          <Selector
            label="Scope"
            value={scopeType}
            options={SCOPE_TYPE_OPTIONS}
            onChange={v => setScopeType(v as RuleFormValue['sourceScopeType'])}
          />
        </div>

        <div style={{flex: '0 0 auto'}}>
          <RuleOptionsSelector value={ruleOptions} onChange={setRuleOptions} />
        </div>

        <div style={{flex: 1}} />

        <Button
          label={expanded ? 'Collapse' : 'Expand'}
          variant="tertiary"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        />
        <Button label="Cancel" variant="secondary" size="sm" onClick={onCancel} />
        <Button label={isEdit ? 'Update' : 'Save Rule'} variant="primary" size="sm" onClick={handleSave} />
      </div>

      {/* Expanded detail — complex selector fields */}
      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--spacing-4)',
          padding: 'var(--spacing-4)',
        }}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
            <SelectorPowerSearch
              label="Sources"
              side="source"
              filters={sourceFilters}
              onFiltersChange={setSourceFilters}
              environment={environment}
            />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
            <SelectorPowerSearch
              label="Destinations"
              side="destination"
              filters={destinationFilters}
              onFiltersChange={setDestinationFilters}
              environment={environment}
            />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
            <Text size="sm" weight="medium">Destination Services</Text>
            <PowerSearch
              label="Destination Services"
              config={portRangeConfig}
              filters={portRangeFilters}
              onChange={f => setPortRangeFilters([...f])}
              placeholder="Select services..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
