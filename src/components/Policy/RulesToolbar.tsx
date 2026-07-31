import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';

const RULE_TYPE_FILTER_OPTIONS = [
  {value: 'allow', label: 'Allow'},
  {value: 'deny', label: 'Deny'},
  {value: 'override_deny', label: 'Override Deny'},
];

interface RulesToolbarProps {
  onAddRule: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (v: string[]) => void;
}

export default function RulesToolbar({onAddRule, search, onSearchChange, typeFilter, onTypeFilterChange}: RulesToolbarProps): JSX.Element {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-3)',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <Button label="+ Add Rule" variant="primary" size="sm" onClick={onAddRule} />
      <div style={{flex: '0 0 auto'}}>
        <MultiSelector
          label="Filter by type"
          value={typeFilter}
          options={RULE_TYPE_FILTER_OPTIONS}
          onChange={onTypeFilterChange}
          placeholder="All types"
          hasClear
        />
      </div>
      <div style={{flex: 1}}>
        <TextInput
          label="Search rules"
          value={search}
          onChange={onSearchChange}
          placeholder="Search..."
        />
      </div>
    </div>
  );
}
