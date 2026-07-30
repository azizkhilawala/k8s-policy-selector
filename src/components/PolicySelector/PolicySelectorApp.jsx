import {useState} from 'react';
import {Theme} from '@astryxdesign/core/Theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Layout, LayoutContent, LayoutPanel} from '@astryxdesign/core/Layout';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {StackItem} from '@astryxdesign/core/StackItem';
import {Section} from '@astryxdesign/core/Section';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {Tokenizer} from '@astryxdesign/core/Tokenizer';
import {Selector} from '@astryxdesign/core/Selector';
import {MultiSelector} from '@astryxdesign/core/MultiSelector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {Banner} from '@astryxdesign/core/Banner';
import {Divider} from '@astryxdesign/core/Divider';
import {FormLayout} from '@astryxdesign/core/FormLayout';

// ── Selector type definitions ──────────────────────────────────────────────
const SRC_TYPES = [
  {value: 'all',             label: 'All Pods'},
  {value: 'pod-labels',      label: 'Pod Labels'},
  {value: 'label-expr',      label: 'Label Expr'},
  {value: 'deployment',      label: 'Deployment'},
  {value: 'service-account', label: 'ServiceAccount'},
];

const DST_TYPES = [
  {value: 'all',             label: 'All Pods'},
  {value: 'pod-labels',      label: 'Pod Labels'},
  {value: 'label-expr',      label: 'Label Expr'},
  {value: 'deployment',      label: 'Deployment'},
  {value: 'service-account', label: 'ServiceAccount'},
  {value: 'ns-labels',       label: 'NS Labels'},
];

const DEPLOYMENTS_SRC = [
  {value: 'frontend-web',    label: 'frontend-web'},
  {value: 'frontend-api',    label: 'frontend-api'},
  {value: 'frontend-worker', label: 'frontend-worker'},
];

const DEPLOYMENTS_DST = [
  {value: 'api-server',   label: 'api-server'},
  {value: 'data-service', label: 'data-service'},
  {value: 'cache-proxy',  label: 'cache-proxy'},
];

const SERVICE_ACCOUNTS_SRC = [
  {value: 'default',         label: 'default'},
  {value: 'frontend-sa',     label: 'frontend-sa'},
  {value: 'api-gateway-sa',  label: 'api-gateway-sa'},
];

const SERVICE_ACCOUNTS_DST = [
  {value: 'default',       label: 'default'},
  {value: 'backend-sa',    label: 'backend-sa'},
  {value: 'db-service-sa', label: 'db-service-sa'},
];

const QUICK_PORTS = [
  {value: 'tcp-443',  label: 'TCP 443',  proto: 'TCP', port: '443'},
  {value: 'tcp-8080', label: 'TCP 8080', proto: 'TCP', port: '8080'},
  {value: 'tcp-3306', label: 'TCP 3306', proto: 'TCP', port: '3306'},
  {value: 'udp-53',   label: 'UDP 53',   proto: 'UDP', port: '53'},
];

// ── Tokenizer search sources (sync) ───────────────────────────────────────
function makeLabelSearchSource(suggestions) {
  return {
    search: (query) => {
      const q = query.toLowerCase();
      return suggestions.filter(s => s.label.toLowerCase().includes(q));
    },
    bootstrap: () => suggestions,
  };
}

const SRC_LABEL_SUGGESTIONS = [
  {id: 'app=frontend', label: 'app=frontend'},
  {id: 'tier=web',     label: 'tier=web'},
  {id: 'env=prod',     label: 'env=prod'},
  {id: 'version=v2',  label: 'version=v2'},
];

const DST_LABEL_SUGGESTIONS = [
  {id: 'app=api',     label: 'app=api'},
  {id: 'tier=web',    label: 'tier=web'},
  {id: 'env=prod',    label: 'env=prod'},
  {id: 'app=db',      label: 'app=db'},
  {id: 'tier=backend',label: 'tier=backend'},
];

// ── Label expression row ──────────────────────────────────────────────────
function LabelExprRow({row, onChange, onRemove}) {
  return (
    <HStack gap={1} vAlign="center">
      <StackItem size="fill">
        <TextInput
          label="Key"
          isLabelHidden
          size="sm"
          placeholder="key"
          value={row.key}
          onChange={v => onChange({...row, key: v})}
        />
      </StackItem>
      <Selector
        label="Op"
        isLabelHidden
        size="sm"
        value={row.op}
        onChange={v => onChange({...row, op: v})}
        options={[
          {value: 'In',            label: 'In'},
          {value: 'NotIn',         label: 'NotIn'},
          {value: 'Exists',        label: 'Exists'},
          {value: 'DoesNotExist',  label: '!Exists'},
        ]}
      />
      <StackItem size="fill">
        <TextInput
          label="Values"
          isLabelHidden
          size="sm"
          placeholder={row.op === 'Exists' || row.op === 'DoesNotExist' ? '(no values)' : 'val1, val2'}
          value={row.values}
          isDisabled={row.op === 'Exists' || row.op === 'DoesNotExist'}
          onChange={v => onChange({...row, values: v})}
        />
      </StackItem>
      <Button size="sm" variant="ghost" label="Remove" onPress={onRemove} />
    </HStack>
  );
}

// ── Workload selector panel (src or dst) ──────────────────────────────────
function WorkloadSelector({types, typeValue, onTypeChange, ns, deployments, serviceAccounts, labelSuggestions}) {
  const [labelTokens, setLabelTokens]   = useState([]);
  const [exprRows, setExprRows]         = useState([{id: 0, key: '', op: 'In', values: ''}]);
  const [deployment, setDeployment]     = useState('');
  const [serviceAccount, setSA]         = useState('');
  const [nsLabelRows, setNsLabelRows]   = useState([{id: 0, key: '', op: 'In', values: ''}]);
  const nextId = (rows) => Math.max(0, ...rows.map(r => r.id)) + 1;

  return (
    <VStack gap={2}>
      {/* Type picker */}
      <MultiSelector
        label="Selector type"
        isLabelHidden
        size="sm"
        triggerDisplay="badges"
        options={types}
        value={[typeValue]}
        onChange={([v]) => v && onTypeChange(v)}
      />

      {/* All pods */}
      {typeValue === 'all' && (
        <Text size="sm" color="secondary">
          All pods in <Text size="sm" weight="medium" color="primary">{ns}</Text>
        </Text>
      )}

      {/* Pod labels tokenizer */}
      {typeValue === 'pod-labels' && (
        <Tokenizer
          label="Pod label selector"
          isLabelHidden
          size="sm"
          placeholder="Search or type key=value…"
          hasCreate
          hasClear
          hasEntriesOnFocus
          searchSource={makeLabelSearchSource(labelSuggestions)}
          value={labelTokens}
          onChange={setLabelTokens}
        />
      )}

      {/* Label expressions */}
      {typeValue === 'label-expr' && (
        <VStack gap={1}>
          {exprRows.map((row, i) => (
            <LabelExprRow
              key={row.id}
              row={row}
              onChange={updated => setExprRows(rows => rows.map(r => r.id === row.id ? updated : r))}
              onRemove={() => setExprRows(rows => rows.filter(r => r.id !== row.id))}
            />
          ))}
          <Button
            size="sm"
            variant="ghost"
            label="+ Add expression"
            onPress={() => setExprRows(rows => [...rows, {id: nextId(rows), key: '', op: 'In', values: ''}])}
          />
        </VStack>
      )}

      {/* Deployment */}
      {typeValue === 'deployment' && (
        <Selector
          label="Deployment"
          isLabelHidden
          size="sm"
          placeholder="Select Deployment…"
          hasSearch
          options={deployments}
          value={deployment}
          onChange={setDeployment}
        />
      )}

      {/* ServiceAccount */}
      {typeValue === 'service-account' && (
        <Selector
          label="ServiceAccount"
          isLabelHidden
          size="sm"
          placeholder="Select ServiceAccount…"
          options={serviceAccounts}
          value={serviceAccount}
          onChange={setSA}
        />
      )}

      {/* NS Labels (destination only) */}
      {typeValue === 'ns-labels' && (
        <VStack gap={1}>
          <Text size="xs" color="secondary">
            Match pods in any namespace whose labels satisfy:
          </Text>
          {nsLabelRows.map(row => (
            <LabelExprRow
              key={row.id}
              row={row}
              onChange={updated => setNsLabelRows(rows => rows.map(r => r.id === row.id ? updated : r))}
              onRemove={() => setNsLabelRows(rows => rows.filter(r => r.id !== row.id))}
            />
          ))}
          <Button
            size="sm"
            variant="ghost"
            label="+ Add NS label"
            onPress={() => setNsLabelRows(rows => [...rows, {id: nextId(rows), key: '', op: 'In', values: ''}])}
          />
        </VStack>
      )}
    </VStack>
  );
}

// ── Port section ──────────────────────────────────────────────────────────
function PortSection({selectedPorts, onPortsChange, allPorts, onAllPortsChange}) {
  const [customProto, setCustomProto] = useState('TCP');
  const [customPort,  setCustomPort]  = useState('');

  function addCustomPort() {
    if (!customPort.trim()) return;
    const label = `${customProto} ${customPort.trim()}`;
    if (!selectedPorts.includes(label)) onPortsChange([...selectedPorts, label]);
    setCustomPort('');
  }

  return (
    <VStack gap={2}>
      <MultiSelector
        label="Quick ports"
        isLabelHidden
        size="sm"
        triggerDisplay="badges"
        maxBadges={6}
        isDisabled={allPorts}
        options={QUICK_PORTS}
        value={selectedPorts}
        onChange={onPortsChange}
      />

      <HStack gap={1} vAlign="end">
        <Selector
          label="Protocol"
          isLabelHidden
          size="sm"
          value={customProto}
          onChange={setCustomProto}
          options={[
            {value: 'TCP',  label: 'TCP'},
            {value: 'UDP',  label: 'UDP'},
            {value: 'SCTP', label: 'SCTP'},
          ]}
        />
        <StackItem size="fill">
          <TextInput
            label="Port"
            isLabelHidden
            size="sm"
            placeholder="443 or 9000-9090 or named"
            value={customPort}
            onChange={setCustomPort}
            isDisabled={allPorts}
          />
        </StackItem>
        <Button size="sm" variant="secondary" label="Add" isDisabled={allPorts} onPress={addCustomPort} />
      </HStack>
    </VStack>
  );
}

// ── YAML generator ─────────────────────────────────────────────────────────
function generateYaml(direction, srcType, dstType, selectedPorts, allPorts) {
  const portBlock = allPorts
    ? '  # (all ports)'
    : selectedPorts.length
      ? selectedPorts
          .map(p => {
            const [proto, port] = p.split(' ');
            return `  - protocol: ${proto}\n    port: ${port}`;
          })
          .join('\n')
      : '  # no ports selected';

  const dirTypes = direction === 'ingress'
    ? '- Ingress'
    : direction === 'egress'
      ? '- Egress'
      : '- Ingress\n  - Egress';

  return `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-backend
  namespace: backend
spec:
  podSelector: {}
  policyTypes:
  ${dirTypes}
${direction !== 'egress' ? `  ingress:
  - from:
    - podSelector: {} # ${srcType}
      namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: frontend
    ports:
${portBlock}` : ''}
${direction !== 'ingress' ? `  egress:
  - to:
    - podSelector: {} # ${dstType}
      namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: backend
    ports:
${portBlock}` : ''}`;
}

// ── Main app ───────────────────────────────────────────────────────────────
export default function PolicySelectorApp() {
  const [direction,      setDirection]      = useState('both');
  const [srcType,        setSrcType]        = useState('all');
  const [dstType,        setDstType]        = useState('pod-labels');
  const [selectedPorts,  setSelectedPorts]  = useState(['tcp-443']);
  const [allPorts,       setAllPorts]       = useState(false);
  const [scopeOpen,      setScopeOpen]      = useState(false);

  const yaml = generateYaml(direction, srcType, dstType, selectedPorts, allPorts);

  return (
    <Theme theme={neutralTheme}>
      <AppShell>
        <Layout>
          {/* ── Slide-out panel (simulated) ── */}
          <LayoutPanel width={700} hasDivider padding={0}>
            <VStack height="100vh">

              {/* Header */}
              <Section padding={3} dividers={['bottom']}>
                <HStack vAlign="center">
                  <StackItem size="fill">
                    <VStack gap={0}>
                      <Heading size="sm">Add Rule</Heading>
                      <Text size="xs" color="secondary">
                        Container Segmentation · prod-eks-us-east-1 · NS→NS Same Cluster
                      </Text>
                    </VStack>
                  </StackItem>
                  <Badge label="K8s Native" color="blue" />
                </HStack>
              </Section>

              {/* Body */}
              <StackItem size="fill">
                <VStack gap={3} padding={4} isScrollable>

                  {/* Scope (collapsible) */}
                  <Collapsible
                    defaultIsOpen={false}
                    isOpen={scopeOpen}
                    onOpenChange={setScopeOpen}
                    trigger={
                      <HStack vAlign="center" gap={2}>
                        <StackItem size="fill">
                          <HStack gap={1} vAlign="center">
                            <Text size="sm" weight="medium">Scope</Text>
                            <Token label="frontend" color="blue" size="sm" />
                            <Text size="sm" color="secondary">→</Text>
                            <Token label="backend" color="purple" size="sm" />
                          </HStack>
                        </StackItem>
                        <Badge label="Complete" color="green" />
                      </HStack>
                    }
                  >
                    <Section padding={3} variant="muted">
                      <HStack gap={4} vAlign="center">
                        <VStack gap={1}>
                          <Text size="xs" color="secondary" weight="medium">Source Namespace</Text>
                          <Token label="frontend" color="blue" />
                        </VStack>
                        <Text size="lg" color="secondary">→</Text>
                        <VStack gap={1}>
                          <Text size="xs" color="secondary" weight="medium">Destination Namespace</Text>
                          <Token label="backend" color="purple" />
                        </VStack>
                      </HStack>
                    </Section>
                  </Collapsible>

                  <Divider />

                  {/* Rule section */}
                  <VStack gap={3}>
                    <HStack vAlign="center">
                      <StackItem size="fill">
                        <Heading size="xs">Rule</Heading>
                        <Text size="xs" color="secondary">
                          Define source pods, destination pods, and ports
                        </Text>
                      </StackItem>
                      <Badge label="Defining" color="yellow" />
                    </HStack>

                    {/* Direction */}
                    <VStack gap={1}>
                      <Text size="xs" color="secondary" weight="medium">Direction</Text>
                      <SegmentedControl
                        label="Rule direction"
                        value={direction}
                        onChange={setDirection}
                        layout="fill"
                      >
                        <SegmentedControlItem value="ingress" label="↓ Ingress" />
                        <SegmentedControlItem value="both"    label="↕ Both"    />
                        <SegmentedControlItem value="egress"  label="↑ Egress"  />
                      </SegmentedControl>
                      <Text size="xs" color="secondary">
                        {direction === 'both'
                          ? 'Generates paired ingress + egress NetworkPolicy rules'
                          : direction === 'ingress'
                            ? 'Restricts inbound traffic into destination namespace pods'
                            : 'Restricts outbound traffic from source namespace pods'}
                      </Text>
                    </VStack>

                    {/* Source / Destination grid */}
                    <HStack gap={3} vAlign="start">

                      {/* Source */}
                      <StackItem size="fill">
                        <Card padding={3}>
                          <VStack gap={2}>
                            <HStack vAlign="center" gap={1}>
                              <Text size="xs" color="secondary" weight="medium">SOURCE PODS</Text>
                              <Token label="frontend" color="blue" size="sm" />
                            </HStack>
                            <WorkloadSelector
                              types={SRC_TYPES}
                              typeValue={srcType}
                              onTypeChange={setSrcType}
                              ns="frontend"
                              deployments={DEPLOYMENTS_SRC}
                              serviceAccounts={SERVICE_ACCOUNTS_SRC}
                              labelSuggestions={SRC_LABEL_SUGGESTIONS}
                            />
                          </VStack>
                        </Card>
                      </StackItem>

                      {/* Arrow */}
                      <Text size="xl" color="secondary" style={{paddingTop: 40}}>→</Text>

                      {/* Destination */}
                      <StackItem size="fill">
                        <Card padding={3}>
                          <VStack gap={2}>
                            <HStack vAlign="center" gap={1}>
                              <Text size="xs" color="secondary" weight="medium">DESTINATION PODS</Text>
                              <Token label="backend" color="purple" size="sm" />
                            </HStack>
                            <WorkloadSelector
                              types={DST_TYPES}
                              typeValue={dstType}
                              onTypeChange={setDstType}
                              ns="backend"
                              deployments={DEPLOYMENTS_DST}
                              serviceAccounts={SERVICE_ACCOUNTS_DST}
                              labelSuggestions={DST_LABEL_SUGGESTIONS}
                            />
                          </VStack>
                        </Card>
                      </StackItem>
                    </HStack>

                    {/* Port / Protocol */}
                    <Card padding={3}>
                      <VStack gap={2}>
                        <Text size="xs" color="secondary" weight="medium">PORT / PROTOCOL</Text>
                        <PortSection
                          selectedPorts={selectedPorts}
                          onPortsChange={setSelectedPorts}
                          allPorts={allPorts}
                          onAllPortsChange={setAllPorts}
                        />
                      </VStack>
                    </Card>

                    {/* Info banner */}
                    <Banner
                      status="info"
                      title="NS→NS Same Cluster — native NetworkPolicy output"
                      description="No Illumio label lookups required. The generated resource targets the backend namespace directly."
                      container="card"
                    />
                  </VStack>
                </VStack>
              </StackItem>

              {/* Footer */}
              <Section padding={3} dividers={['top']}>
                <HStack hAlign="end" gap={1}>
                  <Button variant="ghost"     label="Cancel"     />
                  <Button variant="secondary" label="Save Draft" />
                  <Button variant="primary"   label="Add Rule →" />
                </HStack>
              </Section>

            </VStack>
          </LayoutPanel>

          {/* ── Right: YAML preview ── */}
          <LayoutContent isScrollable>
            <VStack gap={3} padding={4}>
              <Heading size="xs">Live YAML Preview</Heading>
              <Card padding={3}>
                <pre style={{
                  fontFamily: 'var(--font-family-mono, monospace)',
                  fontSize: '12px',
                  lineHeight: '1.7',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                  margin: 0,
                }}>
                  {yaml}
                </pre>
              </Card>

              <Heading size="xs">Selector Type Reference</Heading>
              <Card padding={3}>
                <VStack gap={1}>
                  {[
                    {type: 'All Pods',       field: 'podSelector: {}'},
                    {type: 'Pod Labels',     field: 'matchLabels: {k: v}'},
                    {type: 'Label Expr',     field: 'matchExpressions: [...]'},
                    {type: 'Deployment',     field: '→ pod label selector'},
                    {type: 'ServiceAccount', field: 'k8s:serviceaccount label'},
                    {type: 'NS Labels',      field: 'namespaceSelector: {...}'},
                  ].map(({type, field}) => (
                    <HStack key={type} vAlign="center" gap={2}>
                      <StackItem size="fill">
                        <Text size="sm">{type}</Text>
                      </StackItem>
                      <Text size="xs" color="secondary"
                        style={{fontFamily: 'monospace'}}>{field}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>
            </VStack>
          </LayoutContent>
        </Layout>
      </AppShell>
    </Theme>
  );
}
