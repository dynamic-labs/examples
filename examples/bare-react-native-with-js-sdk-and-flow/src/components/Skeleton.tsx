import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { colors, radii } from '../consts/theme';

type SkeletonProps = {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A pulsing placeholder block for content that's still loading (e.g. Home's
 * vault balance before the first balance query resolves). Opacity-pulses
 * rather than the more common left-to-right shimmer sweep — a fixed-size
 * Animated.View pulsing in place needs no gradient/mask setup, which keeps
 * this dependency-free for a demo app that already has react-native-svg and
 * react-native-linear-gradient available if a future pass wants the fancier
 * version.
 */
export function Skeleton({
  width,
  height,
  borderRadius = radii.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.divider,
          opacity,
        },
        style,
      ]}
    />
  );
}
