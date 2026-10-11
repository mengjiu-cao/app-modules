import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { consumerManifest, packages, safeRelative, sha256, verifyDistribution, walkFiles } from './native-list-dist.mjs';

const write = (root, file, value) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), value); };
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'native-list-dist-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const pkg of packages) {
    write(root, `${pkg.path}/package.json`, JSON.stringify({ name: pkg.name, main: 'lib/module/index.js', types: 'lib/typescript/src/index.d.ts', source: 'src/index.ts' }));
    for (const file of ['lib/module/index.js', 'lib/typescript/src/index.d.ts', 'src/index.ts', 'nitrogen/generated/stub.cpp', 'android/build.gradle', 'android/CMakeLists.txt', 'ios/Stub.swift', 'nitro.json', 'LICENSE']) write(root, `${pkg.path}/${file}`, 'fixture');
  }
  for (const file of ['android/kotlin/com/margelo/nitro/nativelist/views/HybridNativeListManager.kt', 'ios/c++/views/HybridNativeListComponent.mm']) write(root, `native-views/react-native-native-list/nitrogen/generated/${file}`, '// NativeList container slot mounting');
  const provenance = { source: { dirty: false }, resources: [], files: Object.fromEntries(walkFiles(root).map((file) => [file, sha256(readFileSync(join(root, file)))])) };
  write(root, 'native-list-provenance.json', JSON.stringify(provenance));
  return { root, provenance };
}
test('consumer package preserves exports and peers without installation/build commands', () => {
  const source = { name: 'p', scripts: { prepare: 'yarn build', postinstall: 'nitrogen' }, devDependencies: { yarn: '*' }, packageManager: 'yarn@4', peerDependencies: { react: '*', 'react-native-nitro-modules': '0.37.0' }, exports: { '.': { source: './src/index.ts' } }, 'react-native-builder-bob': {} };
  const result = consumerManifest(source);
  assert.deepEqual(result, { name: source.name, peerDependencies: source.peerDependencies, exports: source.exports });
  assert.ok(source.scripts.prepare);
  assert.throws(() => consumerManifest({ dependencies: { a: 'workspace:*' } }), /nonportable/);
});
test('rejects package traversal and absolute paths', () => {
  for (const path of ['../outside', '/outside', 'nested/../../outside', 'nested\\..\\outside']) assert.throws(() => safeRelative(path), /Unsafe/);
  assert.equal(safeRelative('./src/index.ts'), './src/index.ts');
});
test('verifies every prepared artifact and rejects edits outside recorded source', (t) => {
  const { root } = fixture(t);
  verifyDistribution(root, { publish: true });
  write(root, `${packages[0].path}/src/index.ts`, 'tampered');
  assert.throws(() => verifyDistribution(root), /hash mismatch/);
});
test('unrecorded artifact files cannot silently enter publication', (t) => {
  const { root } = fixture(t);
  write(root, 'unrecorded.ttf', 'font');
  assert.throws(() => verifyDistribution(root), /file set differs/);
});
test('local dirty inputs and unresolved font rights cannot be published', (t) => {
  const { root, provenance } = fixture(t);
  provenance.source.dirty = true;
  write(root, 'native-list-provenance.json', JSON.stringify(provenance));
  verifyDistribution(root);
  assert.throws(() => verifyDistribution(root, { publish: true }), /clean source commit/);
  provenance.source.dirty = false;
  provenance.resources = [{ path: 'font.ttf', licenseStatus: 'unresolved' }];
  write(root, 'native-list-provenance.json', JSON.stringify(provenance));
  assert.throws(() => verifyDistribution(root, { publish: true }), /resolved resource/);
});
