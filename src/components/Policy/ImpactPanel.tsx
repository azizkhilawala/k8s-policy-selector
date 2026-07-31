import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import {Token} from '@astryxdesign/core/Token';

const MOCK_WORKLOADS = [
  {name: 'payments-api-7d8f', env: 'Production', current: 'Selective', next: 'Full'},
  {name: 'checkout-worker-3a2b', env: 'Production', current: 'Visibility', next: 'Selective'},
  {name: 'payments-worker-9c1e', env: 'Staging', current: 'Visibility', next: 'Selective'},
];

interface ImpactPanelProps {
  policyName: string;
  onClose: () => void;
  onConfirmAndProvision: () => void;
}

export default function ImpactPanel({policyName, onClose, onConfirmAndProvision}: ImpactPanelProps) {
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '520px',
      backgroundColor: 'var(--color-background-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 900,
    }}>
      <div style={{padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)'}}>
        <Text size="lg" weight="semibold">Impact Analysis</Text>
        <Text size="sm" color="secondary">
          These workloads will be affected by provisioning &quot;{policyName}&quot;
        </Text>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) 0',
        }}>
          {['Workload', 'Environment', 'Current', 'New'].map(h => (
            <Text key={h} size="sm" weight="semibold" color="secondary">{h}</Text>
          ))}
        </div>

        {MOCK_WORKLOADS.map((w, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-2) 0',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <Text size="sm">{w.name}</Text>
            <Token label={w.env} />
            <Text size="sm" color="secondary">{w.current}</Text>
            <Text size="sm" weight="semibold">{w.next}</Text>
          </div>
        ))}
      </div>

      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-2)',
      }}>
        <Button label="Cancel" variant="secondary" onClick={onClose} />
        <Button label="Confirm & Provision" variant="primary" onClick={onConfirmAndProvision} />
      </div>
    </div>
  );
}
