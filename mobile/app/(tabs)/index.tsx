import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Brand, Card, Screen, styles } from '../../components/ui';
import { samplePerformance, samplePlayer, sampleRounds } from '../../constants/sampleData';
import { theme } from '../../constants/theme';
import { useEntrance } from '../../hooks/useEntrance';

export default function Dashboard() {
  const [period, setPeriod] = useState<'latest' | 'recent'>('latest');
  const data = samplePerformance[period];
  const entrance = useEntrance();
  return <Screen><Brand /><AppText style={styles.eyebrow}>DEMO PREVIEW · SAMPLE DATA</AppText>
    <View><AppText style={styles.muted}>Welcome, {samplePlayer.name} · Sample player</AppText><AppText accessibilityRole="header" style={styles.heading}>Make your next{ '\n' }round count.</AppText></View>
    <Animated.View style={[entrance, { gap: 16 }]}><Card><AppText style={styles.muted}>Handicap · Sample index</AppText><AppText style={local.number}>{samplePlayer.handicap}<AppText style={styles.muted}> HCP</AppText></AppText><AppText style={styles.muted}>An illustration of your future player overview.</AppText></Card>
    <Card><AppText accessibilityRole="header" style={local.subtitle}>Your game at a glance</AppText>
      <View style={local.segment}>{(['latest', 'recent'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: value === period }} onPress={() => setPeriod(value)} style={({ pressed }) => [local.option, { backgroundColor: period === value ? theme.colors.accent : '#222', opacity: pressed ? .8 : 1 }]}><AppText style={{ color: period === value ? '#000' : '#fff', fontSize: 12 }}>{value === 'latest' ? 'Last round' : 'Recent rounds'}</AppText></Pressable>)}</View>
      <View accessibilityLiveRegion="polite" style={local.metrics}><View style={local.stat}><AppText style={styles.muted}>Scoring average</AppText><AppText style={local.statNumber}>{data.score}</AppText></View><View style={local.stat}><AppText style={styles.muted}>Putts / round</AppText><AppText style={local.statNumber}>{data.putts}</AppText></View></View>
      {[{ title: 'Fairways hit', value: data.fairways }, { title: 'Greens in regulation', value: data.greens }].map(metric => <View key={metric.title} accessible accessibilityLabel={`${metric.title}: ${metric.value} percent, sample data`} style={{ gap: 8 }}><View style={local.row}><AppText style={styles.muted}>{metric.title}</AppText><AppText>{metric.value}%</AppText></View><View style={local.track}><View style={[local.fill, { width: `${metric.value}%` }]} /></View></View>)}
    </Card></Animated.View>
    <AppText accessibilityRole="header" style={local.subtitle}>Recent rounds</AppText>{sampleRounds.map(round => <Card key={round.id}><View style={local.row}><View style={{ flex: 1 }}><AppText>{round.course}</AppText><AppText style={styles.muted}>{round.date} · Par {round.par}</AppText></View><AppText style={local.statNumber}>{round.score}</AppText></View></Card>)}
    <AppText style={styles.muted}>All figures are illustrative. Live player data and round tracking are planned for a future sprint.</AppText>
  </Screen>;
}
const local = StyleSheet.create({
  number: { fontSize: 58, lineHeight: 68, fontFamily: theme.fonts.medium, color: theme.colors.accent },
  subtitle: { fontSize: 20, lineHeight: 28, fontFamily: theme.fonts.bold },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { minHeight: 44, padding: 12, borderRadius: 12, justifyContent: 'center' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, paddingVertical: 8 }, stat: { flexGrow: 1 },
  statNumber: { fontSize: 32, lineHeight: 40, fontFamily: theme.fonts.medium },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 5, backgroundColor: '#303030', borderRadius: 3 }, fill: { height: 5, backgroundColor: theme.colors.accent, borderRadius: 3 },
});
