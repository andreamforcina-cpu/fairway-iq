import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppText } from './ui';
import { theme } from '../constants/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

// One cubic flight path, sampled once. Native transforms avoid an SVG dependency.
const points = Array.from({ length: 65 }, (_, index) => {
  const t = index / 64, u = 1 - t;
  return { x: u ** 3 * 22 + 3 * u ** 2 * t * 90 + 3 * u * t ** 2 * 188 + t ** 3 * 300,
    y: u ** 3 * 146 + 3 * u ** 2 * t * 40 + 3 * u * t ** 2 * -20 + t ** 3 * 122 };
});
const segments = points.slice(0, -1).map((point, index) => {
  const next = points[index + 1];
  return { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2,
    length: Math.hypot(next.x - point.x, next.y - point.y) + .6,
    angle: `${Math.atan2(next.y - point.y, next.x - point.x)}rad` as const };
});

export function ShotTrajectory() {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));
  const [width, setWidth] = useState(320);
  useEffect(() => {
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);
  return <View style={local.container} accessible accessibilityLabel="Illustrative golf shot trajectory: a single lime-green flight curve from launch to landing.">
    <AppText style={local.caption}>SHOT TRAJECTORY</AppText>
    <View style={local.plot} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View style={[local.geometry, { transform: [{ scale: Math.min(width, 380) / 320 }] }]}>
        {segments.map((segment, index) => <Animated.View key={index} style={{ position: 'absolute', left: segment.x - segment.length / 2, top: segment.y - .75, width: segment.length, height: 1.5, borderRadius: .75, backgroundColor: theme.colors.accent, transform: [{ rotate: segment.angle }], opacity: progress.interpolate({ inputRange: [index / 64 * .82, index / 64 * .82 + .18], outputRange: [.08, 1], extrapolate: 'clamp' }) }} />)}
        <View style={[local.endpoint, { left: 20.5, top: 144.5 }]} />
        <Animated.View style={[local.endpoint, { left: 298.5, top: 120.5, opacity: progress.interpolate({ inputRange: [.85, 1], outputRange: [.15, 1], extrapolate: 'clamp' }) }]} />
      </View>
    </View>
    <AppText style={local.note}>ILLUSTRATIVE FLIGHT PATH</AppText>
  </View>;
}
const local = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'center' },
  caption: { fontSize: 9, lineHeight: 16, color: theme.colors.muted, letterSpacing: 2 },
  note: { fontSize: 8, lineHeight: 14, color: theme.colors.muted, letterSpacing: 1.4, alignSelf: 'flex-end' },
  plot: { flex: 1, width: '100%', minHeight: 130 },
  geometry: { position: 'absolute', width: 320, height: 160, left: '50%', top: '50%', marginLeft: -160, marginTop: -80 },
  endpoint: { position: 'absolute', width: 3, height: 3, backgroundColor: theme.colors.accent },
});
