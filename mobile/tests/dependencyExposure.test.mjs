import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const routerRoot = path.dirname(require.resolve('expo-router/package.json'));

/** Exercise installed pure parsers without importing native UI barrels into Node. */
function parsers() {
  const cache = new Map(); let calls = 0;
  const tripwire = { parse() { calls++; throw new Error('query-string parser reached'); } };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const local = createRequire(filename);
    function dependency(name) {
      if (name === 'query-string') return tripwire;
      if (name === '../react-navigation/native') return local(path.join(routerRoot, 'build/react-navigation/core/validatePathConfig.js'));
      const resolved = local.resolve(name);
      if (resolved.startsWith(routerRoot + path.sep) && resolved.endsWith('.js')) return load(resolved);
      return local(name);
    }
    const run = vm.runInThisContext(`(function(require,module,exports,__filename,__dirname){${fs.readFileSync(filename, 'utf8')}\n})`, { filename });
    run(dependency, module, module.exports, filename, path.dirname(filename));
    return module.exports;
  }
  return { expo: load(path.join(routerRoot, 'build/fork/getStateFromPath.js')).getStateFromPath,
    fallback: () => load(path.join(routerRoot, 'build/react-navigation/core/getStateFromPath.js')).getStateFromPath,
    calls: () => calls };
}
const config = { screens: { Rounds: 'rounds', Login: 'login' } };
test('installed Expo Router parses incoming queries without query-string.parse', () => {
  const p = parsers();
  const result = p.expo('/rounds?course=Golf%20Club&tag=one&tag=two', config);
  assert.equal(result.routes[0].name, 'Rounds');
  assert.equal(result.routes[0].params.course, 'Golf Club');
  assert.deepEqual(result.routes[0].params.tag, ['one', 'two']);
  assert.equal(p.calls(), 0);
});
test('bounded malformed percent samples avoid the old decoder in the Expo parser', () => {
  const p = parsers();
  for (const sample of ['%', '%GG', '%C0%AF', '%E0%A4%A', '%25', '%F0%9F%8F%8C']) {
    const result = p.expo('/login?value=' + sample, config);
    assert.equal(result.routes[0].name, 'Login');
    assert.equal(typeof result.routes[0].params.value, 'string');
  }
  assert.equal(p.calls(), 0);
});
test('bundled React Navigation fallback still invokes query-string.parse (tripwire control)', () => {
  const p = parsers();
  assert.throws(() => p.fallback()('/rounds?course=Golf', config), /query-string parser reached/);
  assert.equal(p.calls(), 1);
});
test('installed xcode identifier generator uses uuid v4 without a caller buffer', () => {
  const filename = require.resolve('xcode/lib/pbxProject');
  const local = createRequire(filename); const module = { exports: {} }; let calls = 0;
  const run = vm.runInThisContext(`(function(require,module,exports,__filename,__dirname){${fs.readFileSync(filename, 'utf8')}\n})`, { filename });
  run(name => name === 'uuid' ? new Proxy({}, { get(_, version) {
    assert.equal(version, 'v4');
    return (...args) => { assert.equal(args.length, 0); calls++; return '11111111-1111-4111-8111-111111111111'; };
  } }) : local(name), module, module.exports, filename, path.dirname(filename));
  const project = new module.exports('/unused-synthetic-path'); project.allUuids = () => [];
  assert.equal(project.generateUuid(), '111111111111411181111111');
  assert.equal(calls, 1);
});
