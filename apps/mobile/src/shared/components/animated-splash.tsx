import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Must match the expo-splash-screen plugin config in app.json so the native
// splash and this overlay are pixel-identical at handoff.
const SPLASH_BACKGROUND = '#208AEF';
const SPLASH_ICON_WIDTH = 76;

const splashIcon = require('../../../assets/images/splash-icon.png');
const iconSource = Image.resolveAssetSource?.(splashIcon);
const SPLASH_ICON_HEIGHT =
  iconSource?.width && iconSource?.height
    ? SPLASH_ICON_WIDTH * (iconSource.height / iconSource.width)
    : SPLASH_ICON_WIDTH;

/** Minimum time the animated splash stays up so the intro reads, even when
 * auth bootstrap resolves instantly. */
const MIN_SHOW_MS = 1600;
const EXIT_MS = 650;

const WORDMARK = 'VALMATIC'.split('');

function Ring({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }), -1, false)
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.35, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 3]) }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.ring, style]} />;
}

function WordmarkLetter({ letter, index }: { letter: string; index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      450 + index * 55,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [14, 0]) }],
  }));

  return (
    <Animated.Text allowFontScaling={false} style={[styles.wordmarkLetter, style]}>
      {letter}
    </Animated.Text>
  );
}

/**
 * Animated takeover of the static native splash. Renders on top of the app,
 * starting visually identical to the native splash (same background color and
 * icon size), then plays an intro loop until `ready`, and exits by zooming
 * through the logo to reveal the app underneath.
 */
export function AnimatedSplash({ ready, onFinish }: { ready: boolean; onFinish: () => void }) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const exiting = useRef(false);

  const exit = useSharedValue(0);
  const logoPulse = useSharedValue(0);
  const bloom = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SHOW_MS);
    // Gentle breathing on the logo while we wait.
    logoPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    // Depth gradient fades in after handoff so the flat native color comes alive.
    bloom.value = withDelay(150, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }));
    return () => clearTimeout(timer);
  }, [bloom, logoPulse]);

  useEffect(() => {
    if (!ready || !minTimeElapsed || exiting.current) return;
    exiting.current = true;
    exit.value = withTiming(
      1,
      { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onFinish)();
      }
    );
  }, [ready, minTimeElapsed, exit, onFinish]);

  // The native splash hides on our first layout, swapping to this identical frame.
  const handleLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exit.value, [0, 0.6, 1], [1, 1, 0]),
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(exit.value, [0, 1], [1, 9]) }],
    opacity: interpolate(exit.value, [0, 0.8, 1], [1, 0.6, 0]),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(logoPulse.value, [0, 1], [1, 1.07]) }],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    // The wordmark stays put during the zoom so the exit reads as diving
    // through the mark, not the text flying at the viewer.
    opacity: interpolate(exit.value, [0, 0.3], [1, 0]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      onLayout={handleLayout}
    >
      <Animated.View style={[StyleSheet.absoluteFill, bloomStyle]}>
        <LinearGradient
          colors={['#4CA9F7', SPLASH_BACKGROUND, '#0F5FBF']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.stage}>
          <Ring delay={0} />
          <Ring delay={730} />
          <Ring delay={1460} />
          <Animated.View style={logoStyle}>
            <Image
              source={splashIcon}
              style={{ width: SPLASH_ICON_WIDTH, height: SPLASH_ICON_HEIGHT }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.wordmark, wordmarkStyle]}>
        {WORDMARK.map((letter, index) => (
          <WordmarkLetter key={index} letter={letter} index={index} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const RING_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  wordmark: {
    position: 'absolute',
    bottom: 96,
    flexDirection: 'row',
  },
  wordmarkLetter: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 6,
  },
});
