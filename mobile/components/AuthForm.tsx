import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Brand, Card, Screen, styles } from './ui';
import { theme } from '../constants/theme';
import { validateAuthForm } from '../utils/authValidation';
import type { AuthFormErrors, AuthFormValues, AuthMode } from '../utils/authValidation';
import { checkAuthenticationAvailability } from '../services/authAvailability';

interface FieldProps extends Pick<TextInputProps, 'keyboardType' | 'textContentType' | 'autoComplete' | 'autoCapitalize' | 'maxLength'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  password?: boolean;
  disabled: boolean;
}
function AuthField({ label, value, onChange, error, password = false, disabled, ...inputProps }: FieldProps) {
  const [visible, setVisible] = useState(false);
  useFocusEffect(useCallback(() => () => setVisible(false), []));
  return <View style={{ gap: 8 }}><AppText>{label}</AppText><View style={[local.inputRow, error ? local.invalid : undefined]}><TextInput {...inputProps} accessibilityLabel={label} accessibilityHint={error} value={value} onChangeText={onChange} editable={!disabled} secureTextEntry={password && !visible} autoCorrect={false} spellCheck={false} selectionColor={theme.colors.accent} placeholderTextColor={theme.colors.muted} style={local.input} />{password ? <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => setVisible(!visible)} style={local.visibility}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.colors.muted} /></Pressable> : null}</View>{error ? <AppText accessibilityLiveRegion="polite" style={local.error}>{error}</AppText> : null}</View>;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const registration = mode === 'register';
  const title = registration ? 'Create Account' : 'Log In';
  const [values, setValues] = useState<AuthFormValues>({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(false);
  const pending = useRef(false);
  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => {
      active.current = false;
      setValues(previous => ({ ...previous, password: '', confirmPassword: '' }));
      setErrors({}); setMessage(''); setSubmitting(false);
    };
  }, []));

  function update(field: keyof AuthFormValues, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setMessage('');
  }
  async function submit() {
    if (pending.current) return;
    Keyboard.dismiss();
    const validation = validateAuthForm(mode, values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    pending.current = true; setSubmitting(true); setMessage('');
    try {
      // No credentials are passed: there is no backend auth endpoint yet.
      await checkAuthenticationAvailability();
      if (active.current) setMessage('Authentication not available yet. No account was created and you have not been logged in.');
    } catch {
      if (active.current) setMessage('Authentication not available yet. Please try again after the service is connected.');
    } finally {
      pending.current = false;
      if (active.current) { setSubmitting(false); setValues(previous => ({ ...previous, password: '', confirmPassword: '' })); }
    }
  }

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" accessibilityLabel="Back to welcome" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={local.back}><Ionicons name="arrow-back" size={22} color={theme.colors.text} /><AppText>Back</AppText></Pressable><Brand /><AppText accessibilityRole="header" style={styles.heading}>{title}</AppText>
    <Card><AppText style={styles.eyebrow}>AUTHENTICATION NOT AVAILABLE YET</AppText><AppText style={styles.muted}>These forms preview the upcoming account flow. Please use test values. No credentials are sent or saved.</AppText></Card>
    {registration ? <AuthField label="Full Name" value={values.fullName} onChange={value => update('fullName', value)} error={errors.fullName} autoCapitalize="words" textContentType="name" autoComplete="name" maxLength={100} disabled={submitting} /> : null}
    <AuthField label="Email" value={values.email} onChange={value => update('email', value)} error={errors.email} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" maxLength={254} disabled={submitting} />
    <AuthField label="Password" value={values.password} onChange={value => update('password', value)} error={errors.password} autoCapitalize="none" textContentType={registration ? 'newPassword' : 'password'} autoComplete={registration ? 'new-password' : 'current-password'} maxLength={129} password disabled={submitting} />
    {registration ? <><AppText style={styles.muted}>Use 15–128 characters, including spaces or symbols. Don’t reuse a real password for this preview.</AppText><AuthField label="Confirm Password" value={values.confirmPassword} onChange={value => update('confirmPassword', value)} error={errors.confirmPassword} autoCapitalize="none" textContentType="newPassword" autoComplete="new-password" maxLength={129} password disabled={submitting} /></> : null}
    {message ? <AppText accessibilityLiveRegion="polite" style={local.error}>{message}</AppText> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={submitting ? 'Checking authentication availability' : title} accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => { void submit(); }} style={({ pressed }) => [styles.button, { opacity: pressed || submitting ? .8 : 1 }]}>{submitting ? <ActivityIndicator color="#000" /> : <AppText style={styles.buttonText}>{title}</AppText>}</Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.replace(registration ? '/login' : '/register')} style={local.link}><AppText style={{ color: theme.colors.accent }}>{registration ? 'Already have an account? Log In' : 'Create an account'}</AppText></Pressable>
  </Screen></KeyboardAvoidingView>;
}
const local = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingRight: 16 },
  inputRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderColor: theme.colors.border, borderWidth: 1, backgroundColor: theme.colors.surface, borderRadius: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 54, padding: 14, color: theme.colors.text, fontFamily: theme.fonts.regular, fontSize: 16 },
  visibility: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  invalid: { borderColor: '#e7a9a9' }, error: { color: '#e7a9a9', fontSize: 14 },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
