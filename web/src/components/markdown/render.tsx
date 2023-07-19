import { FC, useEffect, useState } from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import strip from 'strip-markdown';

interface Props {
  children: string;
}

export const Markdown: FC<Props> = ({ children }) => {
  return (
    <ReactMarkdown className="break-all" remarkPlugins={[remarkGfm, remarkBreaks]}>
      {children}
    </ReactMarkdown>
  );
};

export const MarkdownToText: FC<Props> = ({ children }) => {
  return (
    <ReactMarkdown className="no-breaks" remarkPlugins={[strip]}>
      {children}
    </ReactMarkdown>
  );
};
