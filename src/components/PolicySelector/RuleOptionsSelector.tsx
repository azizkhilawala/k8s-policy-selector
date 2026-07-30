import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import type {RuleOption} from './types';

const RULE_OPTION_OPTIONS: {value: RuleOption; label: string}[] = [
  {value: 'stateless', label: 'Stateless'},
  {value: 'override_deny', label: 'Override Deny'},
  {value: 'external_scope', label: 'External Scope'},
  {value: 'secure_connect', label: 'SecureConnect'},
  {value: 'machine_auth', label: 'Machine Authentication'},
  {value: 'use_workload_subnets', label: 'Use Workload Subnets'},
];

interface Props {
  value: RuleOption[];
  onChange: (options: RuleOption[]) => void;
  isDisabled?: boolean;
}

export default function RuleOptionsSelector({value, onChange, isDisabled}: Props) {
  return (
    <MultiSelector
      label="Rule Options"
      options={RULE_OPTION_OPTIONS}
      value={value}
      onChange={vals => onChange(vals as RuleOption[])}
      isDisabled={isDisabled}
      triggerDisplay="badges"
      placeholder="Select rule options..."
    />
  );
}
