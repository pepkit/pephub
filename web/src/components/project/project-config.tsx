import Editor from '@monaco-editor/react';
import { FC } from 'react';

interface Props {
  value: string;
  language?: string;
  readOnly?: boolean;
}

export const ProjectConfigEditor: FC<Props> = ({ value, language = 'yaml', readOnly = false }) => {
  return (
    <Editor
      options={{
        readOnly: readOnly,
      }}
      language={language}
      height="40vh"
      defaultLanguage="yaml"
      defaultValue="# Enter your project configuration here"
      value={value}
    />
  );
};
