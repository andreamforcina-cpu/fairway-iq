import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Card, Screen, styles } from '../../components/ui';
import { HoleScoreCard } from '../../components/HoleScoreCard';
import { theme } from '../../constants/theme';
import { createRound, finishRound, formatRelativeScore, holeErrors, previewTotals, roundTotals, validateCourseName } from '../../utils/round';
import type { HoleCount, HoleField, Round, RoundDraft } from '../../types/round';

const unsaved = 'Local preview · Rounds are not saved and may be lost when the app restarts or reloads.';

export default function RoundsScreen() {
  const [course, setCourse] = useState('');
  const [holeCount, setHoleCount] = useState<HoleCount>(9);
  const [draft, setDraft] = useState<RoundDraft | null>(null);
  const [summary, setSummary] = useState<Round | null>(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [attemptedFinish, setAttemptedFinish] = useState(false);
  const totals = draft ? previewTotals(draft.holes) : null;
  const summaryTotals = summary ? roundTotals(summary) : null;

  function start() {
    const validation = validateCourseName(course);
    if (validation) { setError(validation); return; }
    Keyboard.dismiss();
    setDraft(createRound(course, holeCount));
    setSummary(null); setCurrent(0); setError(''); setAttemptedFinish(false);
  }
  function change(field: HoleField, value: string) {
    setDraft(previous => previous ? { ...previous, holes: previous.holes.map((hole, index) => index === current ? { ...hole, [field]: value } : hole) } : previous);
    setError('');
  }
  function finish() {
    if (!draft) return;
    Keyboard.dismiss(); setAttemptedFinish(true);
    const invalid = draft.holes.findIndex(hole => Object.keys(holeErrors(hole)).length > 0);
    if (invalid !== -1) { setCurrent(invalid); setError(`Complete valid entries for hole ${invalid + 1} before finishing.`); return; }
    setSummary(finishRound(draft)); setError('');
  }
  function reset() {
    setDraft(null); setSummary(null); setCourse(''); setCurrent(0); setError(''); setAttemptedFinish(false);
  }

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen keyboardShouldPersistTaps="handled">
    <AppText style={styles.eyebrow}>ROUND TRACKER · LOCAL PREVIEW</AppText><AppText accessibilityRole="header" style={styles.heading}>{summary ? 'Round complete.' : draft ? draft.courseName : 'Start your round.'}</AppText><AppText style={styles.muted}>{unsaved}</AppText>
    {!draft ? <><Card><AppText style={styles.muted}>Golf course name</AppText><TextInput accessibilityLabel="Golf course name" value={course} onChangeText={value => { setCourse(value); setError(''); }} maxLength={100} placeholder="Enter your course" placeholderTextColor={theme.colors.muted} selectionColor={theme.colors.accent} autoCapitalize="words" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={local.input} />
      <AppText style={styles.muted}>Number of holes</AppText><View style={local.row}>{([9, 18] as const).map(count => <Pressable key={count} accessibilityRole="button" accessibilityState={{ selected: holeCount === count }} onPress={() => setHoleCount(count)} style={[local.choice, holeCount === count ? local.selected : undefined]}><AppText style={{ color: holeCount === count ? '#000' : '#fff' }}>{count} holes</AppText></Pressable>)}</View>
      <AppText style={styles.muted}>Each hole starts at par 4. Adjust it to match your course.</AppText></Card>{error ? <AppText accessibilityLiveRegion="polite" style={local.error}>{error}</AppText> : null}<Button label="Start Round" onPress={start} /></> : summary && summaryTotals ? <>
      <Card><AppText style={local.sectionTitle}>{summary.courseName} · {summary.holeCount} holes</AppText><AppText style={local.total}>{summaryTotals.strokes} strokes</AppText><AppText>Total par {summaryTotals.par} · {formatRelativeScore(summaryTotals.relativeToPar)} to par</AppText><AppText>{summaryTotals.putts} total putts</AppText><AppText style={styles.muted}>Completed in this session. Not saved.</AppText></Card>
      <Card><AppText accessibilityRole="header" style={local.sectionTitle}>Your scorecard</AppText>{summary.holes.map(hole => <View key={hole.number} style={local.summaryRow}><AppText style={{ flex: 1 }}>Hole {hole.number}</AppText><AppText style={styles.muted}>Par {hole.par} · {hole.strokes} strokes · {hole.putts} putts</AppText></View>)}</Card>
      <Button label="Start another round" onPress={() => Alert.alert('Start another round?', 'This unsaved summary will be replaced.', [{ text: 'Keep summary', style: 'cancel' }, { text: 'Start another', onPress: reset }])} />
    </> : totals ? <>
      <Card><AppText style={styles.muted}>Running score · {totals.scoredHoles}/{draft.holeCount} holes scored</AppText><AppText accessibilityLiveRegion="polite" style={local.total}>{totals.scoredHoles ? totals.strokes : '—'} strokes <AppText style={{ color: theme.colors.accent }}>({formatRelativeScore(totals.relativeToPar)})</AppText></AppText><AppText style={styles.muted}>{totals.completedHoles}/{draft.holeCount} complete · {totals.putts} recorded putts</AppText></Card>
      <View style={local.holes}>{draft.holes.map((hole, index) => <Pressable key={hole.number} accessibilityRole="button" accessibilityLabel={`Hole ${hole.number}${Object.keys(holeErrors(hole)).length === 0 ? ', complete' : ', incomplete'}`} accessibilityState={{ selected: current === index }} onPress={() => { Keyboard.dismiss(); setCurrent(index); }} style={[local.holeChoice, current === index ? local.selected : undefined]}><AppText style={{ color: current === index ? '#000' : '#fff' }}>{hole.number}</AppText></Pressable>)}</View>
      <HoleScoreCard hole={draft.holes[current]} showRequired={attemptedFinish} onChange={change} />
      {error ? <AppText accessibilityLiveRegion="polite" style={local.error}>{error}</AppText> : null}
      <View style={local.row}>{current > 0 ? <View style={{ flex: 1 }}><Button label="Previous hole" onPress={() => { Keyboard.dismiss(); setCurrent(current - 1); }} /></View> : null}{current < draft.holeCount - 1 ? <View style={{ flex: 1 }}><Button label="Next hole" onPress={() => { Keyboard.dismiss(); setCurrent(current + 1); }} /></View> : null}</View>
      <Button label="Finish Round" onPress={finish} />
    </> : null}
  </Screen></KeyboardAvoidingView>;
}
const local = StyleSheet.create({
  input: { minHeight: 52, backgroundColor: '#000', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 14, fontFamily: theme.fonts.regular, color: theme.colors.text, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  choice: { flex: 1, minHeight: 48, backgroundColor: '#222', borderRadius: 12, padding: 12, alignItems: 'center' },
  selected: { backgroundColor: theme.colors.accent },
  holes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  holeChoice: { minWidth: 44, minHeight: 44, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#e7a9a9', fontSize: 14 },
  total: { fontSize: 30, lineHeight: 40, fontFamily: theme.fonts.medium },
  sectionTitle: { fontSize: 18, fontFamily: theme.fonts.bold },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
});
