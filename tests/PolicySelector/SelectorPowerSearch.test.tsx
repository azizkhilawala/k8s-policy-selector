import {render, screen} from '@testing-library/react';
import SelectorPowerSearch from '../../src/components/PolicySelector/SelectorPowerSearch';

describe('SelectorPowerSearch', () => {
  it('renders with source placeholder', () => {
    render(
      <SelectorPowerSearch
        label="Sources"
        side="source"
        filters={[]}
        clusters={[]}
        onFiltersChange={() => {}}
        onClustersChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText('Add source selector...')).toBeInTheDocument();
  });

  it('renders Add cluster button', () => {
    render(
      <SelectorPowerSearch
        label="Destinations"
        side="destination"
        filters={[]}
        clusters={[]}
        onFiltersChange={() => {}}
        onClustersChange={() => {}}
      />,
    );
    expect(screen.getByText('+ Add cluster')).toBeInTheDocument();
  });

  it('shows cluster token when cluster is present', () => {
    render(
      <SelectorPowerSearch
        label="Sources"
        side="source"
        filters={[]}
        clusters={[{type: 'aws', accountId: '123', region: 'us-east-1', clusterName: 'prod-eks'}]}
        onFiltersChange={() => {}}
        onClustersChange={() => {}}
      />,
    );
    expect(screen.getByText('prod-eks (us-east-1)')).toBeInTheDocument();
  });
});
