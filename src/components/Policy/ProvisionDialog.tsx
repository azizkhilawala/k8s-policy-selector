import {useState} from 'react';
import {Dialog} from '@astryxdesign/core/Dialog';
import {DialogHeader} from '@astryxdesign/core/Dialog';
import {Layout} from '@astryxdesign/core/Layout';
import {LayoutContent} from '@astryxdesign/core/Layout';
import {LayoutFooter} from '@astryxdesign/core/Layout';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import type {Policy} from './types';

type State = 'idle' | 'loading';

interface ProvisionDialogProps {
  policy: Policy;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ProvisionDialog({policy, onConfirm, onCancel}: ProvisionDialogProps) {
  const [state, setState] = useState<State>('idle');
  const draftCount = policy.rules.filter(r => r.status === 'draft' || r.status === 'modified').length;

  const handleProvision = async () => {
    setState('loading');
    try {
      await onConfirm();
    } finally {
      setState('idle');
    }
  };

  return (
    <Dialog
      isOpen
      onOpenChange={(open) => { if (!open && state === 'idle') onCancel(); }}
      purpose="form"
      width={480}
    >
      <Layout
        header={
          <DialogHeader
            title={state === 'loading' ? 'Provisioning…' : `Provision ${policy.name}?`}
            onOpenChange={state === 'idle' ? (open) => { if (!open) onCancel(); } : undefined}
            hasDivider
          />
        }
        content={
          <LayoutContent padding={4}>
            {state === 'loading' ? (
              <Text size="sm" color="secondary">
                Pushing changes to active enforcement. This may take a moment…
              </Text>
            ) : (
              <Text size="sm" color="secondary">
                This will push {draftCount} rule {draftCount === 1 ? 'change' : 'changes'} to active enforcement.
              </Text>
            )}
          </LayoutContent>
        }
        footer={
          state === 'idle' ? (
            <LayoutFooter hasDivider padding={4}>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)'}}>
                <Button label="Cancel" variant="secondary" onClick={onCancel} />
                <Button label="Provision Now" variant="primary" onClick={handleProvision} />
              </div>
            </LayoutFooter>
          ) : undefined
        }
        defaultHasDividers
      />
    </Dialog>
  );
}
