import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Row, Section } from '../components/section';

export function SlidersSection() {
  const [progress, setProgress] = React.useState(60);
  return (
    <Section title="Sliders & progress" description="Ranges and loading indicators.">
      <Row label="Slider">
        <Slider
          defaultValue={[progress]}
          max={100}
          step={1}
          onValueChange={([v]) => setProgress(v ?? 0)}
          className="w-full max-w-sm"
        />
      </Row>
      <Row label={`Progress — ${progress}%`}>
        <Progress value={progress} className="w-full max-w-sm" />
      </Row>
    </Section>
  );
}

export function FeedbackSection() {
  return (
    <Section title="Feedback" description="Alerts, avatars, tooltips, skeletons.">
      <Row label="Alert">
        <Alert className="w-full">
          <Sparkles className="size-4" />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            This is a gallery page — every control here is the real component.
          </AlertDescription>
        </Alert>
      </Row>
      <Row label="Avatars">
        <Avatar className="size-9">
          <AvatarFallback className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
            IO
          </AvatarFallback>
        </Avatar>
        <Avatar className="size-9">
          <AvatarFallback className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            JD
          </AvatarFallback>
        </Avatar>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              Hover me
            </Button>
          </TooltipTrigger>
          <TooltipContent>A tooltip, with the same indigo accent.</TooltipContent>
        </Tooltip>
      </Row>
      <Row label="Skeleton">
        <div className="flex w-full items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Row>
    </Section>
  );
}

export function ToastsSection() {
  return (
    <Section title="Toasts & status" description="Transient notifications and loaders.">
      <Row label="Toasts">
        <Button variant="outline" onClick={() => toast('Event created')}>
          Default
        </Button>
        <Button variant="outline" onClick={() => toast.success('Changes saved successfully')}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error('Something went wrong')}>
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast('Project archived', {
              description: 'You can restore it within 30 days.',
              action: { label: 'Undo', onClick: () => toast.success('Restored') },
            })
          }
        >
          With action
        </Button>
      </Row>
      <Separator />
      <Row label="Spinner & keys">
        <Spinner className="size-5 text-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>⇧</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </Row>
    </Section>
  );
}
