import {render, screen} from '@testing-library/react';
import SelectorPowerSearch from '../../src/components/PolicySelector/SelectorPowerSearch';

describe('SelectorPowerSearch', () => {
  it('renders with source placeholder', () => {
    render(
      <SelectorPowerSearch
        label="Sources"
        side="source"
        filters={[]}
        onFiltersChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText('Select Sources...')).toBeInTheDocument();
  });

  it('renders with destination placeholder', () => {
    render(
      <SelectorPowerSearch
        label="Destinations"
        side="destination"
        filters={[]}
        onFiltersChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText('Select Destinations...')).toBeInTheDocument();
  });

  it('renders required label with asterisk', () => {
    render(
      <SelectorPowerSearch
        label="Sources"
        side="source"
        filters={[]}
        onFiltersChange={() => {}}
        isRequired
      />,
    );
    expect(screen.getByText('* Sources')).toBeInTheDocument();
  });
});
