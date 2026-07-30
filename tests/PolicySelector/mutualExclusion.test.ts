import { getConflictingCategories, getConflictWarning, DESTINATION_ONLY_CATEGORIES } from '../../src/components/PolicySelector/mutualExclusion';

describe('getConflictingCategories', () => {
  it('returns empty array when no conflicts', () => {
    expect(getConflictingCategories('ip_list', ['fqdn'])).toEqual([]);
  });

  it('K8s Service conflicts with K8s Labels on destination', () => {
    const conflicts = getConflictingCategories('k8s_service', ['k8s_labels']);
    expect(conflicts).toContain('k8s_labels');
  });

  it('K8s Labels conflicts with K8s Service', () => {
    const conflicts = getConflictingCategories('k8s_labels', ['k8s_service']);
    expect(conflicts).toContain('k8s_service');
  });

  it('K8s Ingress conflicts with K8s Gateway (same mode group)', () => {
    // Both are in service/ingress/gateway mode — no conflict within the group
    const conflicts = getConflictingCategories('k8s_ingress', ['k8s_gateway']);
    expect(conflicts).toHaveLength(0);
  });

  it('AWS VPC conflicts with Azure Subscription', () => {
    const conflicts = getConflictingCategories('cloud_aws_vpc', ['cloud_azure_subscription']);
    expect(conflicts).toContain('cloud_azure_subscription');
  });

  it('AWS Account (org) conflicts with AWS VPC (network)', () => {
    const conflicts = getConflictingCategories('cloud_aws_account', ['cloud_aws_vpc']);
    expect(conflicts).toContain('cloud_aws_vpc');
  });

  it('Azure Subscription conflicts with Azure VNet', () => {
    const conflicts = getConflictingCategories('cloud_azure_subscription', ['cloud_azure_vnet']);
    expect(conflicts).toContain('cloud_azure_vnet');
  });

  it('returns all conflicting categories across multiple groups', () => {
    const conflicts = getConflictingCategories('cloud_aws_vpc', ['cloud_azure_subscription', 'cloud_azure_vnet', 'ip_list']);
    expect(conflicts).toContain('cloud_azure_subscription');
    expect(conflicts).toContain('cloud_azure_vnet');
    expect(conflicts).not.toContain('ip_list');
  });
});

describe('getConflictWarning', () => {
  it('returns a human-readable warning string', () => {
    const msg = getConflictWarning('k8s_service', ['k8s_labels']);
    expect(msg).toContain('K8s Service');
    expect(msg).toContain('K8s Labels');
  });
});

describe('DESTINATION_ONLY_CATEGORIES', () => {
  it('includes fqdn, k8s_service, k8s_ingress, k8s_gateway', () => {
    expect(DESTINATION_ONLY_CATEGORIES).toEqual(
      expect.arrayContaining(['fqdn', 'k8s_service', 'k8s_ingress', 'k8s_gateway']),
    );
  });
});
