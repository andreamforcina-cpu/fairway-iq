import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import ts from 'typescript';
async function load(path) {
  const { outputText } = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { validateAuthForm } = await load('../utils/authValidation.ts');
const valid = { fullName: 'Alex Golfer', email: 'alex@example.test', password: 'test phrase for golf', confirmPassword: 'test phrase for golf' };

test('valid registration passes without changing input', () => {
  const input = { ...valid, email: ' alex@example.test ', fullName: ' Alex Golfer ' };
  const original = { ...input };
  assert.deepEqual(validateAuthForm('register', input), {});
  assert.deepEqual(input, original);
});
test('empty registration reports all required fields', () => {
  assert.deepEqual(Object.keys(validateAuthForm('register', { fullName: '', email: '', password: '', confirmPassword: '' })).sort(), ['confirmPassword', 'email', 'fullName', 'password']);
});
test('names reject blank, oversized and control characters, accept international names', () => {
  for (const fullName of [' ', 'a'.repeat(101), 'Alex\nGolfer', 'Alex\u0000Golfer']) assert.ok(validateAuthForm('register', { ...valid, fullName }).fullName);
  assert.equal(validateAuthForm('register', { ...valid, fullName: 'Ana María 李' }).fullName, undefined);
});
test('emails reject malformed, control-bearing and overlong values', () => {
  for (const email of ['', 'alex', 'alex@host', '@host.test', 'alex@@host.test', 'alex @host.test', 'alex\u0000@host.test', 'a'.repeat(245) + '@example.test']) assert.ok(validateAuthForm('login', { ...valid, email }).email);
});
test('registration accepts passwords at both policy boundaries', () => {
  for (const length of [15, 128]) {
    const password = 'a'.repeat(length);
    assert.deepEqual(validateAuthForm('register', { ...valid, password, confirmPassword: password }), {});
  }
});
test('registration rejects short, whitespace-only and oversized passwords', () => {
  for (const password of ['a'.repeat(14), ' '.repeat(15), 'a'.repeat(129)]) assert.ok(validateAuthForm('register', { ...valid, password, confirmPassword: password }).password);
});
test('confirmation compares exact passwords, including spaces and case', () => {
  for (const confirmPassword of ['', valid.password.toUpperCase(), valid.password + ' ']) assert.ok(validateAuthForm('register', { ...valid, confirmPassword }).confirmPassword);
});
test('login requires only email and password, not registration fields or minimum length', () => {
  assert.deepEqual(validateAuthForm('login', { fullName: '', email: valid.email, password: 'short', confirmPassword: '' }), {});
});
test('login rejects missing and oversized passwords', () => {
  for (const password of ['', 'a'.repeat(129)]) assert.ok(validateAuthForm('login', { ...valid, password }).password);
});
