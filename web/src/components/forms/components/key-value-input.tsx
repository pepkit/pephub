import React, { useState } from 'react';

// Define types for tag values
type TagValue = string | number | boolean;

interface KeyValueInputProps {
  tags: Record<string, TagValue>;
  onAddTag: (key: string, value: string) => void;
  onRemoveTag: (key: string) => void;
}

export const KeyValueInput = ({ tags, onAddTag, onRemoveTag }: KeyValueInputProps) => {
  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');

  const handleAddTag = () => {
    if (tagKey.trim()) {
      // Call parent's handler
      onAddTag(tagKey, tagValue);

      // Reset inputs
      setTagKey('');
      setTagValue('');
    }
  };

  return (
    <div>
      <div className="input-group">
        <span className="input-group-text text-xs fw-semibold">Key</span>
        <input
          type="text"
          className="form-control text-xs"
          placeholder="Key"
          value={tagKey}
          onChange={(e) => setTagKey(e.target.value)}
        />

        <span className="input-group-text text-xs fw-semibold">Value</span>
        <input
          type="text"
          className="form-control text-xs"
          placeholder="Value"
          value={tagValue}
          onChange={(e) => setTagValue(e.target.value)}
        />

        <button
          className="btn btn-success text-xs fw-semibold shadow-none"
          type="button"
          onClick={handleAddTag}
          disabled={!tagKey}
        >
          Add
        </button>
      </div>

      {/* Display current tags */}
      {Object.keys(tags).length > 0 && (
        <div className="mt-2 gap-2 d-flex flex-wrap">
          {Object.entries(tags).map(([key, value]) => (
            <span className="border rounded-2 p-2 text-xs" key={key}>
              <span className="fw-bold">{String(key)}</span>
              {String(value) && <span>: {String(value)}</span>}
              <a className="ms-2 text-danger" type="button" onClick={() => onRemoveTag(key)}>
                <i className="bi bi-trash3-fill"></i>
              </a>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
