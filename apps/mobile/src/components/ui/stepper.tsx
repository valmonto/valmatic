import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { Check } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

type StepperProps = {
  steps: string[];
  /** 0-based index of the active step. Earlier steps render as completed. */
  current: number;
  className?: string;
};

/**
 * A horizontal step indicator for multi-step flows (onboarding, checkout).
 * Completed steps show a check, the current step its number, upcoming steps a
 * muted outline; the connector fills as you progress. Token-based.
 */
function Stepper({ steps, current, className }: StepperProps) {
  return (
    <View className={cn('flex-row items-start', className)}>
      {steps.map((label, i) => {
        const completed = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <View
                className={cn('h-0.5 flex-1 rounded-full', i <= current ? 'bg-primary' : 'bg-border')}
                style={{ marginTop: 15 }}
              />
            ) : null}
            <View className="items-center gap-1.5" style={{ maxWidth: 92 }}>
              <View
                className={cn(
                  'size-8 items-center justify-center rounded-full border-2',
                  completed || active ? 'border-primary bg-primary' : 'border-border bg-card'
                )}>
                {completed ? (
                  <Icon as={Check} size={16} className="text-primary-foreground" />
                ) : (
                  <Text
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      active ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                className={cn(
                  'text-xs',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

export { Stepper };
export type { StepperProps };
