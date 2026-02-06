import React, { useRef, useEffect } from 'react';
import { useEngagementTracker } from '../../hooks/useEngagementTracker';
import { X, Trash2, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EngagementDebugOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  tracker: ReturnType<typeof useEngagementTracker>;
}

export const EngagementDebugOverlay: React.FC<EngagementDebugOverlayProps> = ({
  isVisible,
  onClose,
  tracker,
}) => {
  const { isWindowOpen, totalEngagedSeconds, windowTimeRemaining, debugEvents, clearDebugEvents } =
    tracker;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top of list (newest first)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [debugEvents]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-100 w-80 md:w-96 font-sans animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex flex-col max-h-[500px] border border-slate-200 shadow-xl bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <Activity size={16} className={isWindowOpen ? 'text-emerald-500' : 'text-amber-500'} />
            <span className="font-bold text-sm text-rangam-navy font-display">
              Engagement Debugger
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rangam-navy transition-colors p-1 hover:bg-slate-200 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100 shrink-0">
          <div className="flex flex-col p-3 bg-white">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Status
            </span>
            <span
              className={cn(
                'text-lg font-bold font-mono tracking-tight',
                isWindowOpen ? 'text-emerald-600' : 'text-amber-600'
              )}
            >
              {isWindowOpen ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
          <div className="flex flex-col p-3 bg-white">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Window Time
            </span>
            <span
              className={cn(
                'text-lg font-bold font-mono tracking-tight',
                windowTimeRemaining > 0 ? 'text-rangam-blue' : 'text-slate-300'
              )}
            >
              {windowTimeRemaining}s
            </span>
          </div>
          <div className="col-span-2 flex items-center justify-between p-2 bg-slate-50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium pl-1">
              Session Total
            </span>
            <span className="font-mono text-rangam-blue font-bold pr-1">
              {totalEngagedSeconds}s
            </span>
          </div>
        </div>

        {/* Event Log */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 shrink-0 border-b border-slate-100">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
              Event Log
            </span>
            <button
              onClick={clearDebugEvents}
              className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors uppercase font-medium"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>

          <div
            ref={scrollRef}
            className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1 min-h-[200px]"
          >
            {debugEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                <Activity size={24} className="opacity-20" />
                <span className="text-xs italic">Waiting for events...</span>
              </div>
            )}
            {debugEvents.map((ev) => (
              <div
                key={ev.id}
                className="text-xs p-2 rounded bg-slate-50 border border-slate-100 flex flex-col gap-1 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'font-bold uppercase text-[10px] tracking-wide',
                      ev.type === 'WINDOW_OPEN'
                        ? 'text-emerald-600'
                        : ev.type === 'WINDOW_EXTEND'
                          ? 'text-blue-600'
                          : ev.type === 'WINDOW_CLOSE'
                            ? 'text-red-500'
                            : ev.type === 'TRACK_EVENT'
                              ? 'text-cyan-600'
                              : 'text-amber-600'
                    )}
                  >
                    {ev.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-500 transition-colors">
                    {new Date(ev.timestamp).toLocaleTimeString().split(' ')[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 truncate">{ev.details}</span>
                  {ev.tier && (
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full uppercase font-medium shrink-0',
                        ev.tier === 'tier3'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : ev.tier === 'tier2'
                            ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                            : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {ev.tier}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
