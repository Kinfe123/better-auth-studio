import { useState } from 'react'
import { Terminal as TerminalIcon, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react'

interface TerminalLine {
  id: string
  type: 'info' | 'success' | 'error' | 'progress'
  message: string
  timestamp: Date
  status?: 'pending' | 'running' | 'completed' | 'failed'
}

interface TerminalProps {
  title?: string
  lines: TerminalLine[]
  isRunning?: boolean
  className?: string
  defaultCollapsed?: boolean
}

export function Terminal({ title = "Seeding Terminal", lines, isRunning = false, className = "", defaultCollapsed = false }: TerminalProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const getLineIcon = (line: TerminalLine) => {
    switch (line.type) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'error':
        return <XCircle className="w-3 h-3 text-red-400" />
      case 'progress':
        return line.status === 'running' ? (
          <Loader className="w-3 h-3 text-blue-400 animate-spin" />
        ) : line.status === 'completed' ? (
          <CheckCircle className="w-3 h-3 text-green-400" />
        ) : line.status === 'failed' ? (
          <XCircle className="w-3 h-3 text-red-400" />
        ) : (
          <div className="w-3 h-3 border border-gray-500 rounded-full" />
        )
      default:
        return <div className="w-3 h-3 border border-gray-500 rounded-full" />
    }
  }

  const getLineColor = (line: TerminalLine) => {
    switch (line.type) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'progress':
        return line.status === 'running' ? 'text-blue-400' : 
               line.status === 'completed' ? 'text-green-400' :
               line.status === 'failed' ? 'text-red-400' : 'text-gray-400'
      default:
        return 'text-gray-300'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }) + '.' + date.getMilliseconds().toString().padStart(3, '0')
  }

  return (
    <div className={`bg-black/90 border border-dashed border-white/20 rounded-none font-mono text-xs ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-dashed border-white/10">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-3 h-3 text-green-400" />
          <span className="text-green-400 font-medium text-xs">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isRunning && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs">RUNNING</span>
            </div>
          )}
                 <div className="text-gray-400 text-xs">
                   {lines.length} / {lines.length}
                 </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

             {/* Terminal Content */}
             {!isCollapsed && (
               <div className="p-3 space-y-0.5 h-56 overflow-y-auto">
                 {lines.length === 0 ? (
                   <div className="text-gray-500 italic text-xs">
                     <span className="text-green-400">$</span> Waiting for operations...
                   </div>
                 ) : (
                   lines.map((line) => (
                     <div 
                       key={line.id} 
                       className={`flex items-start space-x-3 py-1 ${getLineColor(line)} text-xs`}
                     >
                       <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                         {formatTime(line.timestamp)}
                       </span>
                       <span className="text-green-400 flex-shrink-0">$</span>
                       <div className="flex-shrink-0 mt-0.5">
                         {getLineIcon(line)}
                       </div>
                       <span className="flex-1 min-w-0 break-words">{line.message}</span>
                     </div>
                   ))
                 )}
          
          {/* Cursor */}
          {isRunning && (
            <div className="flex items-start space-x-3 py-1 text-green-400 text-xs">
              <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                {formatTime(new Date())}
              </span>
              <span className="text-green-400 flex-shrink-0">$</span>
              <div className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="flex-1 flex items-center">
                <span className="animate-pulse">█</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Terminal Footer */}
      {!isCollapsed && (
        <div className="px-3 py-1.5 border-t border-dashed border-white/10 bg-black/50">
                 <div className="flex items-center justify-between text-xs text-gray-400">
                   <div className="flex items-center space-x-3">
                     <span>Status: {isRunning ? 'Active' : 'Idle'}</span>
                     <span>Lines: {lines.length}</span>
                   </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span>Better Auth Studio</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add custom CSS for fade-in animation
const style = document.createElement('style')
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`
document.head.appendChild(style)
