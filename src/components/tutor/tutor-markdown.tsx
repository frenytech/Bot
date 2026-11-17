import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeMath } from '@/lib/tutor/policy';
export function TutorMarkdown({ children }: { children: string }) {
  return <div className="tutor-prose min-w-0 break-words"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, trust: false }]]} components={{
    table: ({ children }) => <div className="max-w-full overflow-x-auto"><table>{children}</table></div>,
    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  }}>{normalizeMath(children)}</ReactMarkdown></div>;
}
