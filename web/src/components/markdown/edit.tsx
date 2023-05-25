import { FC } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import { Markdown } from './render';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
}

export const MarkdownEditor: FC<Props> = ({ value, onChange, name }) => {
  const predictRows = (value: string) => {
    const chars = value.length;
    const rows = Math.floor(chars / 80);
    return rows;
  };
  return (
    <div className="">
      <Tabs>
        <Tab eventKey="edit" title="Edit">
          <div className="p-2 border border-top-0 rounded-bottom">
            <textarea
              className="form-control border-0 rounded-0"
              placeholder="Write your content here..."
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              rows={predictRows(value || '')}
              name={name}
            ></textarea>
          </div>
        </Tab>
        <Tab eventKey="preview" title="Preview">
          <div className="p-2 border border-top-0 rounded-bottom">
            <Markdown>{value || ''}</Markdown>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};
