import {render, screen, fireEvent} from '@testing-library/react';
import CloudResourceEditor, {
  serializeCloudEditor,
  deserializeCloudEditor,
  cloudResourceGetString,
} from '../../src/components/PolicySelector/CloudResourceEditor';

describe('serialize/deserialize', () => {
  it('round-trips', () => {
    const val = {entries: [{id: 'vpc-123', region: 'us-east-1', accountId: '111'}]};
    expect(deserializeCloudEditor(serializeCloudEditor(val))).toEqual(val);
  });
  it('defaults to one empty entry for null', () => {
    expect(deserializeCloudEditor(null).entries).toHaveLength(1);
  });
});

describe('cloudResourceGetString', () => {
  it('formats AWS VPC entry', () => {
    const s = serializeCloudEditor({entries: [{id: 'vpc-abc', region: 'us-east-1', accountId: '123'}]});
    expect(cloudResourceGetString(s, 'cloud_aws_vpc')).toBe('vpc-abc · us-east-1');
  });
  it('includes +N for multiple entries', () => {
    const s = serializeCloudEditor({entries: [{id: 'vpc-1', region: 'us-east-1'}, {id: 'vpc-2', region: 'us-west-2'}]});
    expect(cloudResourceGetString(s, 'cloud_aws_vpc')).toContain('+1');
  });
});

describe('CloudResourceEditor component', () => {
  it('renders VPC fields for cloud_aws_vpc category', () => {
    render(<CloudResourceEditor category="cloud_aws_vpc" onChange={() => {}} placeholder="" value={null} />);
    expect(screen.getByLabelText('Account ID')).toBeInTheDocument();
    expect(screen.getByLabelText('VPC ID')).toBeInTheDocument();
  });

  it('adds a second entry on Add button click', () => {
    render(<CloudResourceEditor category="cloud_aws_vpc" onChange={() => {}} placeholder="" value={null} />);
    fireEvent.click(screen.getByText('+ Add another VPC'));
    expect(screen.getAllByLabelText('VPC ID')).toHaveLength(2);
  });
});
