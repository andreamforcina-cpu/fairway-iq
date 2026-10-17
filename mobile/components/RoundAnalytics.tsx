import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, Screen, styles } from './ui';
import { theme } from '../constants/theme';
import { useSession } from '../hooks/useSession';
import { useSavedRounds } from '../hooks/useSavedRounds';
import { performanceSummary } from '../utils/dashboard';
import { formatRelativeScore, roundTotals } from '../utils/round';
import type { HoleCount } from '../types/round';

export default function RoundAnalytics() {
  const { user } = useSession();
  if (!user) return <Screen>
    <AppText style={styles.eyebrow}>PERFORMANCE ANALYTICS</AppText>
    <AppText accessibilityRole="header" style={styles.heading}>Your rounds. Your data.</AppText>
    <Card><AppText>Log in to see analytics from your synced account rounds.</AppText><AppText style={styles.muted}>Shared preview and older local rounds are kept separate and never included in account statistics.</AppText></Card>
    <Button label="Log in for account analytics" onPress={() => router.push('/login')} />
  </Screen>;
  return <AccountAnalytics key={user.id} />;
}

function AccountAnalytics() {
  const [holeCount, setHoleCount] = useState<HoleCount>(9);
  const { history, error, loading, reload, notice } = useSavedRounds();
  const data = performanceSummary(history ?? [], holeCount);
  const metric = (value: number | null) => value === null ? '—' : value.toFixed(1);
  return <Screen>
    <AppText style={styles.eyebrow}>PERFORMANCE ANALYTICS</AppText>
    <AppText accessibilityRole="header" style={styles.heading}>Understand your rounds.</AppText>
    <AppText style={styles.muted}>Real scores from your synced account rounds. No estimates for unrecorded shots.</AppText>
    <View accessibilityLabel="Analytics round length" style={local.row}>{([9, 18] as const).map(value => <Pressable key={value}
      accessibilityRole="button" accessibilityLabel={`${value}-hole analytics`} accessibilityState={{ selected: value === holeCount }}
      onPress={() => setHoleCount(value)} style={({ pressed }) => [local.option, { backgroundColor: holeCount === value ? theme.colors.accent : '#222', opacity: pressed ? .8 : 1 }]}>
      <AppText style={{ color: holeCount === value ? '#000' : theme.colors.text }}>{value} holes</AppText>
    </Pressable>)}</View>
    <Button label={loading ? 'Refreshing analytics…' : 'Refresh account analytics'} busy={loading} onPress={reload} />
    {notice ? <Card><AppText accessibilityLiveRegion="polite">{notice}</AppText><AppText style={styles.muted}>Synced copies shown here may be older than the latest server history. Refresh when connected.</AppText></Card> : null}
    {loading ? <AppText accessibilityLiveRegion="polite">Loading synced rounds…</AppText> : error ? <Card>
      <AppText accessibilityLiveRegion="polite">Unable to read account rounds. Existing data has been kept.</AppText><Button label="Retry analytics loading" onPress={reload} />
    </Card> : <>
      <Card>
        <AppText accessibilityRole="header" style={local.title}>Last {data.count || 'five'} complete {holeCount}-hole round{data.count === 1 ? '' : 's'}</AppText>
        <View accessibilityLiveRegion="polite" style={local.row}>
          <View style={local.metric}><AppText style={styles.muted}>Strokes / round</AppText><AppText style={local.value}>{metric(data.score)}</AppText></View>
          <View style={local.metric}><AppText style={styles.muted}>Putts / round</AppText><AppText style={local.value}>{metric(data.putts)}</AppText></View>
        </View>
        <AppText>Sample: {data.count} complete synced round{data.count === 1 ? '' : 's'}.</AppText>
        <AppText style={styles.muted}>{data.completeCount} complete {holeCount}-hole round{data.completeCount === 1 ? '' : 's'} in this cache. Averages use at most the latest five. Home matches these averages when set to Last 5 complete rounds and the same length.</AppText>
        {!data.count ? <AppText>No complete synced {holeCount}-hole rounds in this cache yet. Finish and sync a full round to see these averages.</AppText> : data.count === 1 ? <AppText style={styles.muted}>One round describes one result; it cannot establish a trend.</AppText> : <AppText style={styles.muted}>These are descriptive results, not proof of improvement. Course and tee difficulty may differ.</AppText>}
      </Card>
      <Card>
        <AppText accessibilityRole="header" style={local.title}>Excluded from these averages</AppText>
        <AppText>{data.partialCount} synced partial {holeCount}-hole round{data.partialCount === 1 ? '' : 's'}</AppText>
        <AppText>{data.pendingCount} pending {holeCount}-hole round{data.pendingCount === 1 ? '' : 's'}</AppText>
        <AppText style={styles.muted}>Unplayed holes are not filled with zero. Pending rounds enter statistics after server confirmation. Drafts and preview records are excluded.</AppText>
        {data.pendingCount ? <Button label="Open Rounds to check pending saves" onPress={() => router.push('/(tabs)/rounds')} /> : null}
      </Card>
      <AppText accessibilityRole="header" style={local.title}>Recent complete scores · newest first</AppText>
      {data.sequence.map(entry => {
        const totals = roundTotals(entry.round);
        return <Card key={entry.id}>
          <AppText>{entry.round.courseName} · {new Date(entry.completedAt).toLocaleDateString()}</AppText>
          <AppText style={local.value}>{totals.strokes} strokes</AppText>
          <AppText>Par {totals.par} · {formatRelativeScore(totals.relativeToPar)} to par · {totals.putts} putts</AppText>
        </Card>;
      })}
      <AppText style={styles.muted}>Account cache: up to 1,000 rounds, not lifetime statistics. The sequence uses recorded completion dates and is not adjusted for course difficulty. Penalties, fairways, greens, handicap and strokes gained are not calculated from these records.</AppText>
    </>}
  </Screen>;
}
const local = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  option: { minHeight: 44, padding: 12, borderRadius: 12, flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  metric: { flexGrow: 1 },
  title: { fontSize: 18, fontFamily: theme.fonts.bold },
  value: { fontSize: 28, lineHeight: 36, fontFamily: theme.fonts.medium },
});
