import {useState} from 'react';
import {Token} from '@astryxdesign/core/Token';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Text} from '@astryxdesign/core/Text';
import type {ClusterRef} from './types';

const CLUSTER_TYPE_OPTIONS = [
  {value: 'id', label: 'Direct ID'},
  {value: 'aws', label: 'AWS EKS'},
  {value: 'gcp', label: 'GCP GKE'},
  {value: 'azure', label: 'Azure AKS'},
  {value: 'oci', label: 'OCI OKE'},
];

function clusterLabel(ref: ClusterRef): string {
  if (ref.type === 'id') return ref.id;
  if (ref.type === 'aws') return `${ref.clusterName} (${ref.region})`;
  if (ref.type === 'gcp') return `${ref.clusterName} (${ref.location})`;
  if (ref.type === 'azure') return `${ref.clusterName} · ${ref.resourceGroup}`;
  if (ref.type === 'oci') return `${ref.clusterName} (${ref.region})`;
  return '';
}

interface Props {
  clusters: ClusterRef[];
  onChange: (clusters: ClusterRef[]) => void;
  isDisabled?: boolean;
}

export default function ClusterSelector({clusters, onChange, isDisabled}: Props) {
  const [adding, setAdding] = useState(false);
  const [draftType, setDraftType] = useState<string>('aws');
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});

  const commitDraft = () => {
    let ref: ClusterRef | null = null;
    if (draftType === 'id') ref = {type: 'id', id: draftFields['id'] ?? ''};
    else if (draftType === 'aws') ref = {type: 'aws', accountId: draftFields['accountId'] ?? '', region: draftFields['region'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    else if (draftType === 'gcp') ref = {type: 'gcp', projectId: draftFields['projectId'] ?? '', location: draftFields['location'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    else if (draftType === 'azure') ref = {type: 'azure', subscriptionId: draftFields['subscriptionId'] ?? '', resourceGroup: draftFields['resourceGroup'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    else if (draftType === 'oci') ref = {type: 'oci', compartmentId: draftFields['compartmentId'] ?? '', region: draftFields['region'] ?? '', clusterName: draftFields['clusterName'] ?? ''};
    if (ref) onChange([...clusters, ref]);
    setAdding(false);
    setDraftFields({});
  };

  const DRAFT_FIELDS: Record<string, {key: string; label: string}[]> = {
    id: [{key: 'id', label: 'Cluster ID'}],
    aws: [{key: 'accountId', label: 'Account ID'}, {key: 'region', label: 'Region'}, {key: 'clusterName', label: 'Cluster Name'}],
    gcp: [{key: 'projectId', label: 'Project ID'}, {key: 'location', label: 'Location'}, {key: 'clusterName', label: 'Cluster Name'}],
    azure: [{key: 'subscriptionId', label: 'Subscription ID'}, {key: 'resourceGroup', label: 'Resource Group'}, {key: 'clusterName', label: 'Cluster Name'}],
    oci: [{key: 'compartmentId', label: 'Compartment ID'}, {key: 'region', label: 'Region'}, {key: 'clusterName', label: 'Cluster Name'}],
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)'}}>
      <div style={{display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', alignItems: 'center'}}>
        <Text size="sm" weight="medium" color="secondary">Cluster</Text>
        {clusters.map((ref, i) => (
          <Token
            key={i}
            label={clusterLabel(ref)}
            onRemove={() => onChange(clusters.filter((_, j) => j !== i))}
          />
        ))}
        {!isDisabled && (
          <Button label="+ Add cluster" variant="tertiary" size="sm" onClick={() => setAdding(true)} />
        )}
      </div>

      {adding && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', padding: 'var(--spacing-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-container)'}}>
          <Selector label="Cluster type" value={draftType} options={CLUSTER_TYPE_OPTIONS} onChange={setDraftType} />
          {(DRAFT_FIELDS[draftType] ?? []).map(f => (
            <TextInput key={f.key} label={f.label} value={draftFields[f.key] ?? ''} onChange={v => setDraftFields(prev => ({...prev, [f.key]: v}))} />
          ))}
          <div style={{display: 'flex', gap: 'var(--spacing-2)'}}>
            <Button label="Add" variant="primary" onClick={commitDraft} />
            <Button label="Cancel" variant="secondary" onClick={() => { setAdding(false); setDraftFields({}); }} />
          </div>
        </div>
      )}
    </div>
  );
}
