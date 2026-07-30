import {useState, useMemo} from 'react';
import {PowerSearch} from '@astryxdesign/core/PowerSearch';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {buildSelectorConfig} from './selectorConfig';
import {getConflictingCategories, getConflictWarning} from './mutualExclusion';
import type {SelectorSide, SelectorCategory} from './types';

interface Props {
  label: string;
  side: SelectorSide;
  filters: ReadonlyArray<PowerSearchFilter>;
  onFiltersChange: (filters: ReadonlyArray<PowerSearchFilter>) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export default function SelectorPowerSearch({
  label, side, filters, onFiltersChange, isRequired, isDisabled,
}: Props) {
  const config = useMemo(() => buildSelectorConfig(side), [side]);
  const [pendingFilters, setPendingFilters] = useState<ReadonlyArray<PowerSearchFilter> | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [conflictKeys, setConflictKeys] = useState<string[]>([]);

  const handleChange = (newFilters: ReadonlyArray<PowerSearchFilter>, changeType: 'add' | 'edit' | 'remove', index: number) => {
    if (changeType !== 'add') {
      onFiltersChange(newFilters);
      return;
    }
    const incoming = newFilters[index];
    const existingCategories = filters.map(f => f.fieldKey as string);
    const conflicts = getConflictingCategories(
      incoming.fieldKey as SelectorCategory,
      existingCategories as SelectorCategory[],
    );
    if (conflicts.length === 0) {
      onFiltersChange(newFilters);
    } else {
      setConflictKeys(conflicts as string[]);
      setPendingFilters(newFilters);
      setConflictWarning(getConflictWarning(
        incoming.fieldKey as SelectorCategory,
        conflicts as SelectorCategory[],
      ));
    }
  };

  const confirmConflict = () => {
    if (pendingFilters) {
      onFiltersChange(pendingFilters.filter(f => !conflictKeys.includes(f.fieldKey as string)));
    }
    setPendingFilters(null);
    setConflictWarning(null);
    setConflictKeys([]);
  };

  const dismissConflict = () => {
    setPendingFilters(null);
    setConflictWarning(null);
    setConflictKeys([]);
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'}}>
      <div style={{display: 'flex', gap: 'var(--spacing-1)', alignItems: 'center'}}>
        {isRequired && <Text size="sm" color="critical">*</Text>}
        <Text size="sm" weight="medium">{label}</Text>
      </div>

      {conflictWarning && (
        <Banner
          status="warning"
          title={conflictWarning}
          endContent={
            <div style={{display: 'flex', gap: 'var(--spacing-2)'}}>
              <Button label="Continue" variant="primary" size="sm" onClick={confirmConflict} />
              <Button label="Cancel" variant="secondary" size="sm" onClick={dismissConflict} />
            </div>
          }
        />
      )}

      <PowerSearch
        label={isRequired ? `* ${label}` : label}
        config={config}
        filters={filters}
        onChange={handleChange}
        placeholder={`Select ${label}...`}
        isDisabled={isDisabled}
      />
    </div>
  );
}
