import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface SolutionDisplayProps {
  content: string;
  isLoading: boolean;
}

const SolutionDisplay = ({ content, isLoading }: SolutionDisplayProps) => {
  return (
    <div className="rounded-2xl bg-gradient-card border border-border/50 shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">AI Solution</span>
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto" />
        ) : content ? (
          <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
        ) : null}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {!content && isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Analyzing your problem...</span>
          </div>
        ) : (
          <motion.div
            className="solution-content prose prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-bold
              prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/30
              prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-3
              prose-strong:text-primary prose-strong:font-semibold
              prose-code:text-primary prose-code:bg-secondary/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-secondary/30 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl prose-pre:p-4
              prose-li:text-foreground/90 prose-li:leading-relaxed prose-li:mb-1.5
              prose-ol:space-y-2 prose-ul:space-y-1.5
              prose-a:text-primary
              prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4
              prose-hr:border-border/30 prose-hr:my-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </ReactMarkdown>
            {isLoading && (
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-0.5" />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SolutionDisplay;
