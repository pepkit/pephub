import Editor from '@monaco-editor/react';
import { FC } from 'react';

interface Props {
  value: string;
  language?: string;
  readOnly?: boolean;
  setValue?: (value: string) => void;
}

export const ProjectConfigEditor: FC<Props> = ({ value, language = 'yaml', readOnly = false, setValue }) => {
  return (
    <Editor
      options={{
        readOnly: readOnly,
      }}
      onChange={(v) => {
        setValue && setValue(v || '');
      }}
      language={language}
      height="40vh"
      defaultLanguage="yaml"
      defaultValue="# Enter your project configuration here"
      value={value}
    />
  );
};
