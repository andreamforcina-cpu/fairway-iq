import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

export function useEntrance() {
  // Opacity remains high enough that content is never hidden while preferences load.
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    let changed = false;
    let animation: Animated.CompositeAnimation | undefined;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      changed = true;
      if (enabled) { animation?.stop(); opacity.setValue(1); }
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active || changed || reduced) return;
      opacity.setValue(0.65);
      animation = Animated.timing(opacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      animation.start();
    }).catch(() => opacity.setValue(1));
    return () => { active = false; animation?.stop(); subscription.remove(); };
  }, [opacity]);
  return { opacity };
}
