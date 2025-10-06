import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom heading styles
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-gray-800" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800" {...props}>{children}</h3>
          ),
          // Custom paragraph styles
          p: ({ children, ...props }) => (
            <p className="mb-4 text-gray-700 leading-relaxed" {...props}>{children}</p>
          ),
          // Custom list styles
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="ml-4" {...props}>{children}</li>
          ),
          // Custom code block styles
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className || ''} block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="mb-4 overflow-x-auto" {...props}>{children}</pre>
          ),
          // Custom blockquote styles
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 italic my-4 text-gray-600" {...props}>
              {children}
            </blockquote>
          ),
          // Custom link styles
          a: ({ href, children, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 underline"
              {...props}
            >
              {children}
            </a>
          ),
          // Custom table styles
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-4 py-2" {...props}>
              {children}
            </td>
          ),
          // Strong/bold text
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900" {...props}>{children}</strong>
          ),
          // Emphasis/italic text
          em: ({ children, ...props }) => (
            <em className="italic text-gray-800" {...props}>{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
