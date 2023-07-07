import { FC } from 'react';
import { Tab, Tabs } from 'react-bootstrap';

import { Markdown } from './render';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  rows?: number;
}

export const MarkdownEditor: FC<Props> = ({ value, onChange, name, rows }) => {
  const predictRows = (value: string) => {
    const chars = value.length;
    const rows = Math.floor(chars / 40);
    return rows;
  };

  const numRows = rows || predictRows(value || '');

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
              rows={numRows}
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
