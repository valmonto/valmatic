import { useEffect, useState } from 'react';
import { Signal, Wifi } from 'lucide-react';

function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Simulated phone status bar: live clock on the left, signal/wifi/battery on
 * the right, with a "dynamic island" pill in the middle. Pure chrome — it
 * exists to sell the device-frame illusion on desktop.
 */
export function StatusBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-9 shrink-0 items-center justify-between px-6 pt-1 text-foreground select-none">
      <span className="w-14 text-[13px] font-semibold tabular-nums tracking-tight">
        {formatClock(now)}
      </span>
      <div className="absolute left-1/2 top-1.5 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/90 dark:bg-black" />
      <div className="flex w-14 items-center justify-end gap-1.5">
        <Signal className="size-3.5" strokeWidth={2.5} />
        <Wifi className="size-3.5" strokeWidth={2.5} />
        <div className="flex items-center gap-px">
          <div className="flex h-3 w-5.5 items-center rounded-[3px] border border-foreground/40 p-px">
            <div className="h-full w-3/4 rounded-[1.5px] bg-foreground" />
          </div>
          <div className="h-1 w-0.5 rounded-r-sm bg-foreground/40" />
        </div>
      </div>
    </div>
  );
}
