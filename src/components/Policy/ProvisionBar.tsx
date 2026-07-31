import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';

interface ProvisionBarProps {
  draftCount: number;
  onShowImpact: () => void;
  onProvision: () => void;
}

export default function ProvisionBar({draftCount, onShowImpact, onProvision}: ProvisionBarProps) {
  if (draftCount === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-3)',
      padding: 'var(--spacing-3) var(--spacing-4)',
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background-surface)',
    }}>
      <Badge label={String(draftCount)} variant="warning" />
      <Text size="sm">unpublished {draftCount === 1 ? 'change' : 'changes'}</Text>
      <div style={{flex: 1}} />
      <Button label="Show Impact" variant="secondary" size="sm" onClick={onShowImpact} />
      <Button label="Provision ▸" variant="primary" size="sm" onClick={onProvision} />
    </div>
  );
}
