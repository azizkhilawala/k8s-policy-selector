import {useState, useMemo} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';
import PolicyHeader from '../components/Policy/PolicyHeader';
import RulesToolbar from '../components/Policy/RulesToolbar';
import RulesTable from '../components/Policy/RulesTable';
import ProvisionBar from '../components/Policy/ProvisionBar';
import ProvisionDialog from '../components/Policy/ProvisionDialog';
import ImpactPanel from '../components/Policy/ImpactPanel';
import AddRulePanel from '../components/PolicySelector/AddRulePanel';
import type {usePolicyStore} from '../stores/policyStore';
import type {Policy, Rule, PolicyType, EnforcementMode} from '../components/Policy/types';
import type {RuleFormValue} from '../components/PolicySelector/types';

interface Props {
  policyId: string | null;
  onBack: () => void;
  store: ReturnType<typeof usePolicyStore>;
}

function makeNewPolicy(): Policy {
  return {
    id: '',
    name: '',
    type: 'organization',
    scope: [],
    enforcementMode: 'visibility',
    environment: 'containers',
    rules: [],
    status: 'draft',
    lastModified: new Date().toISOString(),
  };
}

export default function PolicyEditorPage({policyId, onBack, store}: Props) {
  const existingPolicy = policyId ? store.policies.find(p => p.id === policyId) ?? null : null;
  const isNew = policyId === null;

  const [localPolicy, setLocalPolicy] = useState<Policy>(() => existingPolicy ?? makeNewPolicy());
  const [activePolicyId, setActivePolicyId] = useState<string | null>(policyId);
  const [addRulePanelOpen, setAddRulePanelOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [impactPanelOpen, setImpactPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // When editing an existing policy, keep local state in sync with store for rules
  const policy = activePolicyId
    ? (store.policies.find(p => p.id === activePolicyId) ?? localPolicy)
    : localPolicy;

  const filteredRules = useMemo(() => {
    let rules = policy.rules;
    if (typeFilter.length > 0) rules = rules.filter(r => typeFilter.includes(r.type));
    if (search.trim()) {
      const q = search.toLowerCase();
      rules = rules.filter(r =>
        r.type.includes(q) || r.scopeType.includes(q),
      );
    }
    return rules;
  }, [policy.rules, typeFilter, search]);

  const draftCount = policy.rules.filter(r => r.status !== 'active').length;

  const handleSavePolicy = () => {
    if (!localPolicy.name.trim()) return;
    if (isNew && !activePolicyId) {
      const created = store.createPolicy({
        name: localPolicy.name,
        type: localPolicy.type,
        scope: localPolicy.scope,
        enforcementMode: localPolicy.enforcementMode,
        environment: localPolicy.environment,
      });
      setActivePolicyId(created.id);
    } else if (activePolicyId) {
      store.updatePolicy(activePolicyId, {
        name: localPolicy.name,
        enforcementMode: localPolicy.enforcementMode,
      });
    }
  };

  const handleAddRule = (formValue: RuleFormValue) => {
    if (!activePolicyId) return;
    if (editingRule) {
      store.updateRule(activePolicyId, editingRule.id, {
        type: formValue.ruleType,
        scopeType: formValue.sourceScopeType === 'intra_scope' ? 'intra' : 'extra',
        options: {
          stateless: formValue.ruleOptions.includes('stateless'),
          secureConnect: formValue.ruleOptions.includes('secure_connect'),
          machineAuth: formValue.ruleOptions.includes('machine_auth'),
          useWorkloadSubnets: formValue.ruleOptions.includes('use_workload_subnets'),
        },
      });
    } else {
      store.addRule(activePolicyId, {
        type: formValue.ruleType,
        scopeType: formValue.sourceScopeType === 'intra_scope' ? 'intra' : 'extra',
        sources: [],
        destinations: [],
        services: [],
        options: {
          stateless: formValue.ruleOptions.includes('stateless'),
          secureConnect: formValue.ruleOptions.includes('secure_connect'),
          machineAuth: formValue.ruleOptions.includes('machine_auth'),
          useWorkloadSubnets: formValue.ruleOptions.includes('use_workload_subnets'),
        },
        enabled: true,
      });
    }
    setAddRulePanelOpen(false);
    setEditingRule(null);
  };

  const handleProvision = async () => {
    if (!activePolicyId) return;
    try {
      await new Promise(r => setTimeout(r, 1500));
      store.provisionPolicy(activePolicyId);
      setProvisionDialogOpen(false);
      setSuccessBanner('Policy provisioned. Rules are active.');
    } catch {
      setProvisionDialogOpen(false);
      setErrorBanner('Provisioning failed. Please try again.');
    }
  };

  return (
    <div style={{display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative'}}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        {/* Back nav */}
        <div
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
          }}
        >
          <Button label="← Policies" variant="tertiary" size="sm" onClick={onBack} />
          <Text size="sm" color="secondary">/</Text>
          <Text size="sm">{policy.name || 'New Policy'}</Text>
        </div>

        {successBanner && (
          <Banner status="success" title={successBanner} onDismiss={() => setSuccessBanner(null)} />
        )}
        {errorBanner && (
          <Banner status="error" title={errorBanner} onDismiss={() => setErrorBanner(null)} />
        )}

        <PolicyHeader
          policy={localPolicy}
          onNameChange={name => setLocalPolicy(p => ({...p, name}))}
          onTypeChange={type => setLocalPolicy(p => ({...p, type: type as PolicyType}))}
          onEnforcementModeChange={mode => setLocalPolicy(p => ({...p, enforcementMode: mode as EnforcementMode}))}
          onSave={handleSavePolicy}
          isNew={isNew && !activePolicyId}
        />

        <RulesToolbar
          onAddRule={() => { setEditingRule(null); setAddRulePanelOpen(true); }}
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        <div style={{flex: 1, overflowY: 'auto'}}>
          <RulesTable
            rules={filteredRules}
            onEdit={rule => { setEditingRule(rule); setAddRulePanelOpen(true); }}
            onDelete={ruleId => { if (activePolicyId) store.deleteRule(activePolicyId, ruleId); }}
            onToggleEnabled={(ruleId, enabled) => { if (activePolicyId) store.updateRule(activePolicyId, ruleId, {enabled}); }}
          />
        </div>

        <ProvisionBar
          draftCount={draftCount}
          onShowImpact={() => setImpactPanelOpen(true)}
          onProvision={() => setProvisionDialogOpen(true)}
        />
      </div>

      {addRulePanelOpen && (
        <div style={{position: 'fixed', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 800}}>
          {editingRule && (
            <Banner
              status="info"
              title="Sources and destinations must be reselected when editing a rule."
            />
          )}
          <AddRulePanel
            onSave={handleAddRule}
            onCancel={() => { setAddRulePanelOpen(false); setEditingRule(null); }}
          initialValue={editingRule ? {
            ruleType: editingRule.type,
            sourceScopeType: editingRule.scopeType === 'intra' ? 'intra_scope' : 'extra_scope',
            sources: [],
            sourceClusters: [],
            sourceProcessServices: [],
            destinations: [],
            destinationClusters: [],
            destinationServices: [],
            ruleOptions: [],
          } : undefined}
          environment={policy.environment}
          />
        </div>
      )}

      {provisionDialogOpen && (
        <ProvisionDialog
          policy={policy}
          onConfirm={handleProvision}
          onCancel={() => setProvisionDialogOpen(false)}
        />
      )}

      {impactPanelOpen && (
        <ImpactPanel
          policyName={policy.name}
          onClose={() => setImpactPanelOpen(false)}
          onConfirmAndProvision={() => { setImpactPanelOpen(false); setProvisionDialogOpen(true); }}
        />
      )}
    </div>
  );
}
