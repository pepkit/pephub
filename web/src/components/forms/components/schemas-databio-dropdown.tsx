import React, { useState, useEffect } from 'react';
import Select, { ValueType } from 'react-select';

interface Template {
  name: string;
  project: string;
  description: string;
  url: string;
}

interface Props {
  onSelectTemplate: (template: Template) => void;
  selectedSchema: ValueType<{ label: string; value: string }> | null;
}

const SchemaDropdown: React.FC<Props> = ({ onSelectTemplate, selectedSchema }) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetch('https://schema.databio.org/list.json')
      .then((response) => response.json())
      .then((response) => {
        const tplList = Object.values(response) as Template[];
        setTemplates(tplList);
      })
      .catch((error) => {
        console.log('Error fetching templates:', error);
      });
  }, []);

  const handleSelectTemplate = (option: ValueType<{ label: string; value: string }>) => {
    if (option) {
      const selectedTemplateName = option.value;
      const selectedTemplate = templates.find((template) => template.name === selectedTemplateName);
      if (selectedTemplate) {
        onSelectTemplate(selectedTemplate);
      }
    }
  };

  const options = templates.map((template) => ({
    label: template.url,
    value: template.url,
  }));

  return (
    <div>
      <Select
        options={options}
        value={selectedSchema}
        onChange={handleSelectTemplate}
        placeholder="Assign a schema..."
        isClearable
        menuPlacement="top"
      />
    </div>
  );
};

export { SchemaDropdown };

