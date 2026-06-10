import * as React from 'react';
import { Hexagon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthShellProps {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
  /** Wider card for the multi-field register form. */
  wide?: boolean;
}

/**
 * Shared chrome for the auth pages (login + register): centered card on a
 * Linear-style canvas — faint dotted grid + a single soft indigo glow above.
 */
export function AuthShell({ title, description, children, wide }: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      {/* Dotted grid, masked to fade out toward the edges */}
      <div
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Single soft indigo glow up top */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div
        className="relative w-full animate-in fade-in slide-in-from-bottom-3 duration-500"
        style={{ maxWidth: wide ? '32rem' : '26rem' }}
      >
        {/* Brand */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10">
            <Hexagon className="size-5.5" />
          </div>
          <span className="text-base font-semibold tracking-tight">vboilerplate</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
