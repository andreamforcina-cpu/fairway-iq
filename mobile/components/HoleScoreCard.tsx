import { StyleSheet, TextInput, View } from 'react-native';
import { AppText, Card, styles } from './ui';
import { theme } from '../constants/theme';
import { holeErrors } from '../utils/round';
import type { HoleDraft, HoleField } from '../types/round';

export function HoleScoreCard({ hole, showRequired, onChange }: { hole: HoleDraft; showRequired: boolean; onChange: (field: HoleField, value: string) => void }) {
  const errors = holeErrors(hole);
  return <Card><AppText accessibilityRole="header" style={local.heading}>Hole {hole.number}</AppText>
    <View style={local.fields}>{(['par', 'strokes', 'putts'] as const).map(field => {
      const label = field[0].toUpperCase() + field.slice(1);
      const error = showRequired || hole[field] !== '' ? errors[field] : undefined;
      return <View key={field} style={local.field}><AppText style={styles.muted}>{label}</AppText><TextInput accessibilityLabel={`Hole ${hole.number} ${label}`} accessibilityHint={error ?? (field === 'putts' ? 'Enter zero if you did not putt.' : undefined)} value={hole[field]} onChangeText={value => onChange(field, value)} keyboardType="number-pad" maxLength={3} placeholder={field === 'par' ? '4' : '—'} placeholderTextColor={theme.colors.muted} selectionColor={theme.colors.accent} style={[local.input, error ? local.invalid : undefined]} /><View>{error ? <AppText accessibilityLiveRegion="polite" style={local.error}>{error}</AppText> : null}</View></View>;
    })}</View><AppText style={styles.muted}>Par: 1–6 · Strokes: 1–30 · Putts: 0–strokes</AppText>
    <AppText style={styles.muted}>Strokes includes every shot, including putts.</AppText>
  </Card>;
}
const local = StyleSheet.create({
  heading: { fontFamily: theme.fonts.bold, fontSize: 20 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flexGrow: 1, flexBasis: 85, gap: 8 },
  input: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12, color: theme.colors.text, backgroundColor: '#000', fontFamily: theme.fonts.medium, fontSize: 20 },
  invalid: { borderColor: '#e7a9a9' },
  error: { color: '#e7a9a9', fontSize: 12, lineHeight: 18 },
});
