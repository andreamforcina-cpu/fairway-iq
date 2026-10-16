import { useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { useSession } from '../hooks/useSession';
import { useRoundLibrary } from '../hooks/useRoundLibrary';
import { completeRound } from '../services/roundStore';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Card, Screen, styles } from '../components/ui';
import { HoleScoreCard } from '../components/HoleScoreCard';
import { theme } from '../constants/theme';
import { createRound, finishRound, formatRelativeScore, holeErrors, previewTotals, playedHoleCount, roundTotals, validateCourseName } from '../utils/round';
import type { HoleCount, HoleField, Round, RoundDraft } from '../types/round';

const storageNotice = 'Rounds stay on this device and are shared across accounts and sample preview. They are not synced to your account.';

export default function RoundsScreen() {
  const { user, preview } = useSession();
  // Remount all draft/summary/form state when the account or preview scope changes.
  return <ScopedRounds key={user?.id ?? (preview ? 'preview' : 'signed-out')} account={!!user} />;
}
function ScopedRounds({ account }: { account: boolean }) {
  const [course, setCourse] = useState('');
  const [holeCount, setHoleCount] = useState<HoleCount>(9);
  const { library, setLibrary, message, saving, loading, load, retrySave } = useRoundLibrary();
  const draft = library?.draft ?? null;
  function setDraft(update: RoundDraft | ((previous: RoundDraft | null) => RoundDraft | null)) {
    setLibrary(previous => previous ? { ...previous, draft: typeof update === 'function' ? update(previous.draft) : update } : previous);
  }
  const [summary, setSummary] = useState<Round | null>(null);
  const current = library?.current ?? 0;
  function setCurrent(current: number) { setLibrary(previous => previous ? { ...previous, current } : previous); }
  const [error, setError] = useState('');
  const [attemptedFinish, setAttemptedFinish] = useState(false);
  const [confirmEarly, setConfirmEarly] = useState(false);
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
    Keyboard.dismiss();
    const count = playedHoleCount(draft);
    if (!count) { setError('Enter strokes and putts for at least one hole before finishing.'); return; }
    setAttemptedFinish(true);
    const invalid = draft.holes.slice(0, count).findIndex(hole => Object.keys(holeErrors(hole)).length > 0);
    if (invalid !== -1) { setCurrent(invalid); setError(`Complete strokes and putts for hole ${invalid + 1}. Unplayed holes at the end can be left blank.`); return; }
    if (!library || (library.history.length >= 1000 && (!account || !library.history.some(entry => entry.serverId)))) { setError('This device has reached its 1,000-round limit. Sync pending rounds before adding more.'); return; }
    if (count < draft.holeCount) { setConfirmEarly(true); setError(''); return; }
    saveFinished();
  }
  function saveFinished() {
    if (!draft) return;
    const completed = finishRound(draft, true);
    const completedAt = new Date().toISOString();
    const submissionId = account ? randomUUID() : undefined;
    setLibrary(previous => previous?.draft ? completeRound(previous, completedAt, true, submissionId) : previous);
    setConfirmEarly(false); setSummary(completed); setError('');
  }
  function reset() {
    setSummary(null); setCourse(''); setCurrent(0); setError(''); setAttemptedFinish(false);
  }

  if (!library) return <Screen><AppText accessibilityLiveRegion="polite">{message}</AppText>{!loading ? <Button label="Retry loading rounds" onPress={load} /> : null}</Screen>;

  if (confirmEarly && draft) return <Screen>
    <AppText accessibilityRole="header" style={styles.heading}>Finish this round early?</AppText>
    <Card><AppText>Save {playedHoleCount(draft)} of {draft.holeCount} holes played at {draft.courseName}?</AppText><AppText style={styles.muted}>Only played holes count toward your score and par. The remaining holes will stay unplayed. You can view this scorecard in history, but cannot resume it after finishing.</AppText></Card>
    <Button label={`Finish with ${playedHoleCount(draft)} holes`} onPress={saveFinished} />
    <Button label="Keep playing" onPress={() => setConfirmEarly(false)} />
  </Screen>;

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen keyboardShouldPersistTaps="handled">
    <AppText style={styles.eyebrow}>ROUND TRACKER</AppText><AppText accessibilityRole="header" style={styles.heading}>{summary ? 'Round complete.' : draft ? draft.courseName : 'Start your round.'}</AppText><AppText style={styles.muted}>{account ? 'Completed rounds sync to your account. Drafts stay on this device. Older shared local rounds remain separate in sample preview.' : storageNotice}</AppText><AppText accessibilityLiveRegion="polite" style={styles.muted}>{saving ? (account ? 'Saving and syncing…' : 'Saving on this device…') : message || (account ? 'Saved · completed rounds synced to your account' : 'Saved on this device')}</AppText>{message ? <Button label={account ? "Retry saving and sync" : "Retry saving"} onPress={retrySave} /> : null}
    {!draft && !summary ? <><Card><AppText style={styles.muted}>Golf course name</AppText><TextInput accessibilityLabel="Golf course name" value={course} onChangeText={value => { setCourse(value); setError(''); }} maxLength={100} placeholder="Enter your course" placeholderTextColor={theme.colors.muted} selectionColor={theme.colors.accent} autoCapitalize="words" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={local.input} />
      <AppText style={styles.muted}>Number of holes</AppText><View style={local.row}>{([9, 18] as const).map(count => <Pressable key={count} accessibilityRole="button" accessibilityState={{ selected: holeCount === count }} onPress={() => setHoleCount(count)} style={[local.choice, holeCount === count ? local.selected : undefined]}><AppText style={{ color: holeCount === count ? '#000' : '#fff' }}>{count} holes</AppText></Pressable>)}</View>
      <AppText style={styles.muted}>Each hole starts at par 4. Adjust it to match your course.</AppText></Card>{error ? <AppText accessibilityLiveRegion="polite" style={local.error}>{error}</AppText> : null}<Button label="Start Round" onPress={start} /></> : summary && summaryTotals ? <>
      <Card><AppText style={local.sectionTitle}>{summary.courseName} · {summary.holes.length}/{summary.holeCount} holes played</AppText><AppText style={local.total}>{summaryTotals.strokes} strokes</AppText><AppText>Played par {summaryTotals.par} · {formatRelativeScore(summaryTotals.relativeToPar)} to par</AppText><AppText>{summaryTotals.putts} total putts</AppText><AppText style={styles.muted}>Completed scorecard · Check the save status above before closing the app.</AppText></Card>
      <Card><AppText accessibilityRole="header" style={local.sectionTitle}>Your scorecard</AppText>{summary.holes.map(hole => <View key={hole.number} style={local.summaryRow}><AppText style={{ flex: 1 }}>Hole {hole.number}</AppText><AppText style={styles.muted}>Par {hole.par} · {hole.strokes} strokes · {hole.putts} putts</AppText></View>)}</Card>
      {!draft ? <Button label="Start another round" onPress={reset} /> : null}
    </> : draft && totals ? <>
      <Card><AppText style={styles.muted}>Running score · {totals.scoredHoles}/{draft.holeCount} holes scored</AppText><AppText accessibilityLiveRegion="polite" style={local.total}>{totals.scoredHoles ? totals.strokes : '—'} strokes <AppText style={{ color: theme.colors.accent }}>({formatRelativeScore(totals.relativeToPar)})</AppText></AppText><AppText style={styles.muted}>{totals.completedHoles}/{draft.holeCount} complete · {totals.putts} recorded putts</AppText></Card>
      <View style={local.holes}>{draft.holes.map((hole, index) => <Pressable key={hole.number} accessibilityRole="button" accessibilityLabel={`Hole ${hole.number}${Object.keys(holeErrors(hole)).length === 0 ? ', complete' : ', incomplete'}`} accessibilityState={{ selected: current === index }} onPress={() => { Keyboard.dismiss(); setCurrent(index); }} style={[local.holeChoice, current === index ? local.selected : undefined]}><AppText style={{ color: current === index ? '#000' : '#fff' }}>{hole.number}</AppText></Pressable>)}</View>
      <HoleScoreCard hole={draft.holes[current]} showRequired={attemptedFinish} onChange={change} />
      {error ? <AppText accessibilityLiveRegion="polite" style={local.error}>{error}</AppText> : null}
      <View style={local.row}>{current > 0 ? <View style={{ flex: 1 }}><Button label="Previous hole" onPress={() => { Keyboard.dismiss(); setCurrent(current - 1); }} /></View> : null}{current < draft.holeCount - 1 ? <View style={{ flex: 1 }}><Button label="Next hole" onPress={() => { Keyboard.dismiss(); setCurrent(current + 1); }} /></View> : null}</View>
      <Button label="Finish Round" onPress={finish} />
    </> : null}
    {account ? <Button label="Refresh account rounds" onPress={load} disabled={saving || loading} /> : null}
    {!summary ? <Card><AppText accessibilityRole="header" style={local.sectionTitle}>Round history</AppText>{library.history.length === 0 ? <AppText style={styles.muted}>Completed rounds will appear here.</AppText> : library.history.map(entry => {
      const score = roundTotals(entry.round);
      return <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`View ${entry.round.courseName}, ${entry.round.holes.length} of ${entry.round.holeCount} holes played, ${score.strokes} strokes`} onPress={() => { Keyboard.dismiss(); setSummary(entry.round); }} style={local.historyRow}><AppText>{entry.round.courseName} · {entry.round.holes.length}/{entry.round.holeCount} holes played</AppText><AppText style={styles.muted}>{new Date(entry.completedAt).toLocaleDateString()} · {score.strokes} strokes · {formatRelativeScore(score.relativeToPar)}{account ? (entry.serverId ? ' · Synced' : ' · Pending sync') : ''}</AppText></Pressable>;
    })}</Card> : <Button label={draft ? 'Back to current round' : 'Back to rounds'} onPress={() => setSummary(null)} />}
  </Screen></KeyboardAvoidingView>;
}
const local = StyleSheet.create({
  historyRow: { minHeight: 52, gap: 4, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
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
