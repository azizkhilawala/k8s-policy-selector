import type {SelectorValue, ClusterRef, PortRange} from '../../src/components/PolicySelector/types';

describe('types', () => {
  it('ClusterRef discriminated union narrows correctly', () => {
    const ref: ClusterRef = {type: 'aws', accountId: '123', region: 'us-east-1', clusterName: 'prod'};
    if (ref.type === 'aws') {
      expect(ref.accountId).toBe('123');
    }
  });

  it('PortRange holds TCP protocol', () => {
    const range: PortRange = {protocol: 'TCP', fromPort: 443, toPort: 443};
    expect(range.protocol).toBe('TCP');
  });

  it('SelectorValue category discriminates k8s_labels', () => {
    const val: SelectorValue = {category: 'k8s_labels', labels: ['app=frontend']};
    expect(val.category).toBe('k8s_labels');
  });

  it('SelectorValue category discriminates illumio_labels', () => {
    const val: SelectorValue = {category: 'illumio_labels', labels: ['Role:web', 'Env:Production']};
    expect(val.category).toBe('illumio_labels');
  });
});
