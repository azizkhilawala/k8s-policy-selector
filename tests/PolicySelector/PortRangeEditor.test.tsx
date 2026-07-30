import {render, screen, fireEvent} from '@testing-library/react';
import PortRangeEditor, {portRangeGetString, serializePortRange} from '../../src/components/PolicySelector/PortRangeEditor';

describe('portRangeGetString', () => {
  it('formats single port', () => {
    const s = serializePortRange({ranges: [{protocol: 'TCP', fromPort: 443, toPort: 443}]});
    expect(portRangeGetString(s)).toBe('TCP 443');
  });
  it('formats port range', () => {
    const s = serializePortRange({ranges: [{protocol: 'UDP', fromPort: 8080, toPort: 9000}]});
    expect(portRangeGetString(s)).toBe('UDP 8080–9000');
  });
  it('formats multiple ranges separated by comma', () => {
    const s = serializePortRange({ranges: [
      {protocol: 'TCP', fromPort: 443, toPort: 443},
      {protocol: 'UDP', fromPort: 53, toPort: 53},
    ]});
    expect(portRangeGetString(s)).toBe('TCP 443, UDP 53');
  });
});

describe('PortRangeEditor component', () => {
  it('renders protocol, from port, to port fields', () => {
    render(<PortRangeEditor onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByLabelText('Protocol')).toBeInTheDocument();
    expect(screen.getByLabelText('From port')).toBeInTheDocument();
    expect(screen.getByLabelText('To port')).toBeInTheDocument();
  });

  it('adds a second range on Add button click', () => {
    render(<PortRangeEditor onChange={() => {}} placeholder="" value={null} />);
    fireEvent.click(screen.getByText('+ Add another range'));
    expect(screen.getAllByLabelText('From port')).toHaveLength(2);
  });
});
