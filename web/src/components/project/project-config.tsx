import Editor from '@monaco-editor/react';
import { memo } from 'react';

type Props = {
  value: string;
  language?: string;
  readOnly?: boolean;
  setValue?: (value: string) => void;
  height?: string | number;
};

export const ProjectConfigEditor = (props: Props) => {
  const { value, language = 'yaml', readOnly = false, setValue, height } = props;

  return (
    <Editor
      options={{
        readOnly: readOnly,
      }}
      onChange={(v) => {
        setValue && setValue(v || '');
      }}
      saveViewState
      language={language}
      height={height || '80vh'}
      defaultLanguage="yaml"
      value={value}
      loading={null}
    />
  );
};
