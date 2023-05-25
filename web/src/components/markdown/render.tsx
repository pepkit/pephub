import React, { FC } from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface Props {
  children: string;
}

export const Markdown: FC<Props> = ({ children }) => {
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{children}</ReactMarkdown>;
};
