import { useState } from 'react';
import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Brand, Button, Card, Screen, styles } from './ui';
import { ProfileAvatar } from './ProfileAvatar';
import { theme } from '../constants/theme';
import { useEntrance } from '../hooks/useEntrance';
import { useSavedRounds } from '../hooks/useSavedRounds';
import { dashboardSummary } from '../utils/dashboard';
import { formatRelativeScore, roundTotals } from '../utils/round';
import type { HoleCount } from '../types/round';

export function RoundDashboard() {
  const [period, setPeriod] = useState<'latest' | 'recent'>('latest');
  const [holeCount, setHoleCount] = useState<HoleCount>(9);
  const { history, loading, error, reload } = useSavedRounds();
  const entrance = useEntrance();
  const data = dashboardSummary(history ?? [], holeCount, period);
  const metric = (value: number | null) => value === null ? '—' : value.toFixed(1);
  return <Screen>
    <View style={local.row}><Brand /><ProfileAvatar /></View>
    <AppText style={styles.eyebrow}>ROUNDS ON THIS DEVICE</AppText>
    <View><AppText style={styles.muted}>Your performance</AppText><AppText accessibilityRole="header" style={styles.heading}>Make your next{'\n'}round count.</AppText></View>
    <AppText style={styles.muted}>Local rounds are shared across accounts and preview on this device. They are not synced to your account.</AppText>
    {loading ? <AppText accessibilityLiveRegion="polite">Loading saved rounds…</AppText> : error ? <Card><AppText accessibilityLiveRegion="polite">Unable to read saved rounds. Your data has been kept.</AppText><Button label="Retry loading" onPress={reload} /></Card> : <>
      <Animated.View style={[entrance, { gap: 16 }]}>
        <Card><AppText style={styles.eyebrow}>COMPLETE ROUNDS</AppText>
          <AppText accessibilityRole="header" style={local.subtitle}>Your game at a glance</AppText>
          <View accessibilityLabel="Round length" style={local.segment}>{([9, 18] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: holeCount === value }} onPress={() => setHoleCount(value)} style={({ pressed }) => [local.option, { backgroundColor: holeCount === value ? theme.colors.accent : '#222', opacity: pressed ? .8 : 1 }]}><AppText style={{ color: holeCount === value ? '#000' : '#fff' }}>{value} holes</AppText></Pressable>)}</View>
          <View accessibilityLabel="Round period" style={local.segment}>{(['latest', 'recent'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)} style={({ pressed }) => [local.option, { backgroundColor: period === value ? theme.colors.accent : '#222', opacity: pressed ? .8 : 1 }]}><AppText style={{ color: period === value ? '#000' : '#fff', fontSize: 12 }}>{value === 'latest' ? 'Last complete round' : 'Last 5 complete rounds'}</AppText></Pressable>)}</View>
          <View accessibilityLiveRegion="polite" style={local.metrics}>
            <View style={local.stat}><AppText style={styles.muted}>Scoring average</AppText><AppText style={local.statNumber}>{metric(data.score)}</AppText></View>
            <View style={local.stat}><AppText style={styles.muted}>Putts / round</AppText><AppText style={local.statNumber}>{metric(data.putts)}</AppText></View>
          </View>
          <AppText style={styles.muted}>{data.count ? `Based on ${data.count} complete ${holeCount}-hole round${data.count === 1 ? '' : 's'}. Rounds ended early are excluded.` : `No complete ${holeCount}-hole rounds saved yet. Rounds ended early appear below.`}</AppText>
          <AppText style={styles.muted}>Fairways hit · Not recorded</AppText><AppText style={styles.muted}>Greens in regulation · Not recorded</AppText>
        </Card>
      </Animated.View>
      <AppText accessibilityRole="header" style={local.subtitle}>Recent rounds</AppText>
      {!data.recent.length ? <Card><AppText>No saved rounds yet.</AppText><AppText style={styles.muted}>Finish a round in Rounds to see your results here.</AppText></Card> : data.recent.map(entry => {
        const totals = roundTotals(entry.round);
        const partial = entry.round.holes.length < entry.round.holeCount;
        return <Card key={entry.id}>
          <AppText>{entry.round.courseName}</AppText>
          <AppText style={styles.muted}>{new Date(entry.completedAt).toLocaleDateString()} · {entry.round.holes.length}/{entry.round.holeCount} holes · {partial ? 'Ended early' : 'Complete'}</AppText>
          <AppText style={local.statNumber}>{totals.strokes} strokes · {formatRelativeScore(totals.relativeToPar)}</AppText>
          <AppText style={styles.muted}>Played par {totals.par} · {totals.putts} putts</AppText>
        </Card>;
      })}
      <Button label="Open Rounds" onPress={() => router.push('/(tabs)/rounds')} />
      <AppText style={styles.muted}>Recent rounds include all lengths. Open Rounds to view saved scorecards. Handicap is not calculated.</AppText>
    </>}
  </Screen>;
}
const local = StyleSheet.create({
  subtitle: { fontSize: 20, lineHeight: 28, fontFamily: theme.fonts.bold },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 44, padding: 12, borderRadius: 12, justifyContent: 'center' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, paddingVertical: 8 },
  stat: { flexGrow: 1 }, statNumber: { fontSize: 28, lineHeight: 36, fontFamily: theme.fonts.medium },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
});
