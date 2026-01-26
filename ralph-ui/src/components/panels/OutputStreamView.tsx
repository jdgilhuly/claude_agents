import { useRef, useEffect, useState } from 'react';

interface OutputStreamViewProps {
  outputs: string[];
}

export function OutputStreamView({ outputs }: OutputStreamViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [verboseMode, setVerboseMode] = useState(false);

  // Auto-scroll to bottom when new outputs arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [outputs, autoScroll]);

  // Detect if user scrolled up (disable auto-scroll)
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      setAutoScroll(isAtBottom);
    }
  };

  // Filter outputs based on verbose mode
  const displayOutputs = verboseMode
    ? outputs
    : outputs.filter(isSignificantOutput);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs text-gray-400 uppercase flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Output Stream
          {outputs.length > 0 && (
            <span className="text-gray-500">({outputs.length})</span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          {/* Verbose toggle */}
          <button
            onClick={() => setVerboseMode(!verboseMode)}
            className={`
              px-2 py-0.5 rounded text-xs transition-colors
              ${verboseMode
                ? 'bg-factory-accent/20 text-factory-accent'
                : 'bg-factory-bg text-gray-400 hover:text-gray-300'}
            `}
          >
            {verboseMode ? 'Verbose' : 'Summary'}
          </button>
          {/* Auto-scroll indicator */}
          <button
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }}
            className={`
              p-1 rounded transition-colors
              ${autoScroll
                ? 'text-factory-success'
                : 'text-gray-500 hover:text-gray-300'}
            `}
            title={autoScroll ? 'Auto-scroll enabled' : 'Click to scroll to bottom'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Output container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-factory-bg rounded border border-factory-border overflow-auto max-h-96 min-h-[120px]"
      >
        {displayOutputs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {outputs.length === 0
              ? 'No output yet'
              : 'No significant output (toggle Verbose mode to see all)'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {displayOutputs.map((output, index) => (
              <OutputLine key={index} output={output} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OutputLine({ output }: { output: string }) {
  const type = getOutputType(output);

  const typeStyles = {
    tool_call: 'border-l-factory-info bg-factory-info/5',
    error: 'border-l-factory-danger bg-factory-danger/5',
    success: 'border-l-factory-success bg-factory-success/5',
    text: 'border-l-gray-500',
  };

  const typeIcons = {
    tool_call: (
      <svg className="w-3 h-3 text-factory-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    error: (
      <svg className="w-3 h-3 text-factory-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-3 h-3 text-factory-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    text: null,
  };

  return (
    <div
      className={`
        text-xs font-mono border-l-2 pl-2 py-1 rounded-r
        ${typeStyles[type]}
      `}
    >
      <div className="flex items-start gap-1.5">
        {typeIcons[type] && <span className="mt-0.5">{typeIcons[type]}</span>}
        <span className="text-gray-300 whitespace-pre-wrap break-all">{output}</span>
      </div>
    </div>
  );
}

function getOutputType(output: string): 'tool_call' | 'error' | 'success' | 'text' {
  const lowerOutput = output.toLowerCase();

  if (lowerOutput.includes('error') || lowerOutput.includes('failed') || lowerOutput.includes('exception')) {
    return 'error';
  }
  if (lowerOutput.includes('success') || lowerOutput.includes('passed') || lowerOutput.includes('complete')) {
    return 'success';
  }
  if (lowerOutput.includes('tool') || lowerOutput.includes('invoke') || lowerOutput.includes('calling')) {
    return 'tool_call';
  }
  return 'text';
}

function isSignificantOutput(output: string): boolean {
  const lowerOutput = output.toLowerCase();

  // Always show errors and successes
  if (lowerOutput.includes('error') || lowerOutput.includes('success')) {
    return true;
  }

  // Show tool calls
  if (lowerOutput.includes('tool') || lowerOutput.includes('invoke')) {
    return true;
  }

  // Show file operations
  if (lowerOutput.includes('file') || lowerOutput.includes('wrote') || lowerOutput.includes('created')) {
    return true;
  }

  // Show status changes
  if (lowerOutput.includes('complete') || lowerOutput.includes('started') || lowerOutput.includes('finished')) {
    return true;
  }

  // Filter out very short or trivial outputs
  if (output.trim().length < 10) {
    return false;
  }

  return true;
}
