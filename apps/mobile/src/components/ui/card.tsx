import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

function Card({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <TextClassContext.Provider value="text-card-foreground">
      {/* Glassmorphic surface: a frosted BlurView that picks up whatever is behind
          it, a translucent tint for legibility, a hairline border and a soft
          elevation shadow. The shadow/clip live on the outer View since blur +
          overflow must be clipped together. */}
      <View
        className={cn('overflow-hidden rounded-2xl border border-border', className)}
        style={[
          {
            boxShadow: isDark
              ? '0px 1px 2px rgba(0,0,0,0.30), 0px 12px 32px -16px rgba(0,0,0,0.55)'
              : '0px 1px 2px rgba(16,18,28,0.04), 0px 8px 24px -12px rgba(16,18,28,0.10)',
          },
          style,
        ]}
        {...props}>
        <BlurView
          intensity={isDark ? 24 : 32}
          tint={isDark ? 'dark' : 'light'}
          blurMethod="dimezisBlurView">
          <View
            className="flex flex-col gap-5 py-5"
            style={{ backgroundColor: isDark ? 'rgba(22,22,27,0.55)' : 'rgba(255,255,255,0.55)' }}>
            {children}
          </View>
        </BlurView>
      </View>
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 px-5', className)} {...props} />;
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {

  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('px-5', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-5', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
