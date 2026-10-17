import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const reactUrl = pathToFileURL(require.resolve('react')).href;
function moduleUrl(file, replacements = {}) {
  let source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } });
  outputText = outputText.replaceAll('"react/jsx-runtime"', JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const roundUrl = moduleUrl('../utils/round.ts');
const summaryUrl = moduleUrl('../utils/dashboard.ts', { "'./round'": JSON.stringify(roundUrl) });
const { default: Analytics } = await import(moduleUrl('../components/RoundAnalytics.tsx', {
  "import { useState } from 'react';": `import * as React from '${reactUrl}'; const { useState } = React;`,
  "import { Pressable, StyleSheet, View } from 'react-native';": `const View = ({children}) => React.createElement('div', {}, children); const Pressable = ({children, accessibilityLabel, accessibilityState}) => React.createElement('button', {'aria-label': accessibilityLabel, 'aria-pressed': accessibilityState?.selected}, children); const StyleSheet = { create: value => value };`,
  "import { router } from 'expo-router';": 'const router = { push() {} };',
  "import { AppText, Button, Card, Screen, styles } from './ui';": `const AppText = ({children}) => React.createElement('span', {}, children); const Card = View, Screen = View; const Button = ({label, busy}) => React.createElement('button', {disabled: busy}, label); const styles = {};`,
  "import { theme } from '../constants/theme';": 'const theme = { colors: {}, fonts: {} };',
  "import { useSession } from '../hooks/useSession';": 'const useSession = () => ({ user: globalThis.__analyticsScreen.user });',
  "import { useSavedRounds } from '../hooks/useSavedRounds';": 'const useSavedRounds = () => { globalThis.__analyticsScreen.reads++; return globalThis.__analyticsScreen.state; };',
  "'../utils/dashboard'": JSON.stringify(summaryUrl),
  "'../utils/round'": JSON.stringify(roundUrl),
}));
function render(state = {}, user = { id: 'synthetic-owner' }) {
  globalThis.__analyticsScreen = { user, reads: 0, state: { history: [], loading: false, error: false, reload() {}, notice: '', ...state } };
  return renderToStaticMarkup(React.createElement(Analytics));
}
const complete = { id: 'one', serverId: 'acknowledged', completedAt: '2026-10-16T12:00:00Z', round: { courseName: 'Pine', holeCount: 9, holes: Array.from({length: 9}, (_, i) => ({number: i + 1, par: 4, strokes: 5, putts: 2})) } };
test('preview shows sign-in guidance without reading or summarizing the local library', () => {
  const html = render({ history: [complete] }, null);
  assert.match(html, /Log in for account analytics/); assert.doesNotMatch(html, /45\.0/);
  assert.equal(globalThis.__analyticsScreen.reads, 0);
});
test('loading and storage error do not display stale numeric results', () => {
  const loading = render({ history: [complete], loading: true });
  assert.match(loading, /Loading synced rounds/); assert.doesNotMatch(loading, /45\.0/);
  const failed = render({ history: [complete], error: true });
  assert.match(failed, /Retry analytics loading/); assert.doesNotMatch(failed, /45\.0/);
});
test('empty/pending-only state is honest and offers access to pending saves', () => {
  const html = render({ history: [{ ...complete, serverId: undefined }] });
  assert.match(html, /No complete synced 9-hole rounds/);
  assert.match(html, /1 pending 9-hole round/); assert.match(html, /Open Rounds to check pending saves/);
  assert.doesNotMatch(html, /45\.0/);
});
test('eligible synced data renders real averages, sample count and no trend claim for one round', () => {
  const html = render({ history: [complete] });
  assert.match(html, /45\.0/); assert.match(html, /18\.0/);
  assert.match(html, /Sample: 1 complete synced round/);
  assert.match(html, /cannot establish a trend/); assert.match(html, /newest first/);
  assert.match(html, /aria-label="18-hole analytics"/);
});
test('offline cache notice is visible alongside acknowledged data and cache limits', () => {
  const html = render({ history: [complete], notice: 'Account sync unavailable.' });
  assert.match(html, /Account sync unavailable/); assert.match(html, /45\.0/);
  assert.match(html, /up to 1,000 rounds, not lifetime statistics/);
});
