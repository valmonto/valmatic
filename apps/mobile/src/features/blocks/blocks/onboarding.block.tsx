import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/shared/components/safe-area-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Rocket, Star, TrendingUp, Users, Zap, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

type Slide = {
  icon: LucideIcon;
  title: string;
  description: string;
  orb: [string, string];
  glow: string;
  chipIcon: LucideIcon;
  chip: string;
};

const SLIDES: Slide[] = [
  {
    icon: Rocket,
    title: 'Ship faster',
    description:
      'Plan, track and deliver work from anywhere — your whole workspace in your pocket.',
    orb: ['#6366f1', '#8b5cf6'],
    glow: '#6366f1',
    chipIcon: TrendingUp,
    chip: '2× faster',
  },
  {
    icon: Zap,
    title: 'Stay in sync',
    description: 'Real-time updates on mentions, assignments and deploys the moment they happen.',
    orb: ['#0ea5e9', '#06b6d4'],
    glow: '#0ea5e9',
    chipIcon: Bell,
    chip: 'Real-time',
  },
  {
    icon: Users,
    title: 'Built for teams',
    description: 'Comment, assign and collaborate with your team without ever switching context.',
    orb: ['#10b981', '#34d399'],
    glow: '#10b981',
    chipIcon: Users,
    chip: '12 online',
  },
];

const AVATARS = [11, 12, 13, 14].map((n) => `https://i.pravatar.cc/64?img=${n}`);

/** Conversion-focused onboarding — parallax gradient heroes, social proof, animated dots. */
export function OnboardingBlock() {
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const goTo = (i: number) => {
    ref.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="h-9 flex-row items-center justify-end px-5">
        {!isLast ? (
          <Pressable
            onPress={() => goTo(SLIDES.length - 1)}
            hitSlop={8}
            className="active:opacity-70"
          >
            <Text variant="muted" className="text-sm font-medium">
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={ref as never}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onEnd}
      >
        {SLIDES.map((slide, i) => (
          <SlideView key={i} slide={slide} index={i} scrollX={scrollX} width={width} />
        ))}
      </Animated.ScrollView>

      <View className="gap-5 px-6 pb-4 pt-2">
        {/* Social proof */}
        <View className="items-center gap-1.5">
          <View className="flex-row items-center">
            {AVATARS.map((uri, i) => (
              <View
                key={uri}
                className="bg-background rounded-full p-[2px]"
                style={{ marginLeft: i > 0 ? -10 : 0 }}
              >
                <Avatar alt="Member" className="size-7">
                  <AvatarImage source={{ uri }} />
                  <AvatarFallback>
                    <Text className="text-[9px]">U</Text>
                  </AvatarFallback>
                </Avatar>
              </View>
            ))}
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="flex-row">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} color="#f59e0b" fill="#f59e0b" />
              ))}
            </View>
            <Text variant="muted" className="text-xs">
              Loved by 12,000+ teams
            </Text>
          </View>
        </View>

        {/* Animated dots */}
        <View className="flex-row items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>

        <Button
          onPress={() => (isLast ? undefined : goTo(index + 1))}
          className="h-13 rounded-2xl shadow-lg shadow-primary/30"
        >
          <Text className="text-base font-semibold">
            {isLast ? 'Get started — it’s free' : 'Next'}
          </Text>
        </Button>

        <View className="flex-row items-center justify-center gap-1">
          <Text variant="muted" className="text-sm">
            Already have an account?
          </Text>
          <Text className="text-sm font-semibold text-primary">Sign in</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SlideView({
  slide,
  index,
  scrollX,
  width,
}: {
  slide: Slide;
  index: number;
  scrollX: { value: number };
  width: number;
}) {
  const heroStyle = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      opacity: interpolate(scrollX.value, range, [0.3, 1, 0.3], 'clamp'),
      transform: [
        { scale: interpolate(scrollX.value, range, [0.7, 1, 0.7], 'clamp') },
        { translateY: interpolate(scrollX.value, range, [28, 0, 28], 'clamp') },
      ],
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      opacity: interpolate(scrollX.value, range, [0, 1, 0], 'clamp'),
      transform: [{ translateY: interpolate(scrollX.value, range, [20, 0, 20], 'clamp') }],
    };
  });

  return (
    <View style={{ width }} className="flex-1 items-center justify-center gap-9 px-8">
      <Animated.View style={heroStyle} className="items-center justify-center">
        {/* Soft glow */}
        <LinearGradient
          colors={[slide.glow, 'transparent']}
          style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: 130,
            opacity: 0.28,
          }}
        />
        {/* Gradient orb */}
        <LinearGradient
          colors={slide.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 132,
            height: 132,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: slide.orb[0],
            shadowOpacity: 0.45,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 14 },
            elevation: 14,
          }}
        >
          <Icon as={slide.icon} size={56} className="text-white" />
        </LinearGradient>
        {/* Floating product chip */}
        <View className="border-border bg-card absolute -right-7 top-6 flex-row items-center gap-1 rounded-2xl border px-2.5 py-1.5 shadow-lg shadow-black/20">
          <Icon as={slide.chipIcon} size={12} className="text-primary" />
          <Text className="text-[11px] font-semibold text-foreground">{slide.chip}</Text>
        </View>
      </Animated.View>

      <Animated.View style={textStyle} className="items-center gap-2.5">
        <Text variant="h1" className="text-center text-3xl">
          {slide.title}
        </Text>
        <Text variant="muted" className="max-w-xs text-center text-base leading-relaxed">
          {slide.description}
        </Text>
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: { value: number };
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, range, [8, 22, 8], 'clamp'),
      opacity: interpolate(scrollX.value, range, [0.3, 1, 0.3], 'clamp'),
    };
  });
  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} className="bg-primary" />;
}
