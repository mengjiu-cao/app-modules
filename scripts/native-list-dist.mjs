import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const upstreamBaseline = 'd357a1790298e011415c77b2df8d9f7bbbede595';
export const packages = [
  { name: '@onekeyfe/react-native-native-logger', path: 'native-modules/native-logger' },
  { name: '@onekeyfe/react-native-skeleton', path: 'native-views/react-native-skeleton' },
  { name: '@onekeyfe/react-native-image', path: 'native-views/react-native-image' },
  { name: '@onekeyfe/react-native-native-list', path: 'native-views/react-native-native-list' },
];
const marker = '.native-list-dist-output';
const provenanceName = 'native-list-provenance.json';
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function run(command, args, cwd = sourceRoot, inherit = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed (${result.status})\n${result.stderr ?? ''}`);
  return result.stdout?.trim() ?? '';
}
export function safeRelative(path) {
  if (!path || isAbsolute(path) || path.split(/[\\/]/).includes('..')) throw new Error(`Unsafe package path: ${path}`);
  return path;
}
export function consumerManifest(source) {
  const result = { ...source };
  for (const key of ['scripts', 'devDependencies', 'packageManager', 'workspaces', 'resolutions', 'react-native-builder-bob', 'release-it', 'commitlint', 'jest', 'prettier', 'create-react-native-library', 'publishConfig']) delete result[key];
  for (const group of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [name, version] of Object.entries(result[group] ?? {})) {
      if (/^(workspace:|patch:|portal:|link:|file:)/.test(version)) throw new Error(`${source.name}: nonportable ${group}.${name}: ${version}`);
    }
  }
  return result;
}
export function sourceFingerprint(root = sourceRoot) {
  const paths = [...packages.map((pkg) => pkg.path), 'scripts/native-list-dist.mjs', 'yarn.lock', 'package.json', '.yarnrc.yml'];
  const files = run('git', ['ls-files', '-co', '--exclude-standard', '-z', '--', ...paths], root).split('\0').filter(Boolean);
  const hash = createHash('sha256');
  for (const file of [...new Set(files)].sort()) {
    const path = join(root, file);
    hash.update(file).update('\0');
    hash.update(existsSync(path) ? readFileSync(path) : '<deleted>');
  }
  return hash.digest('hex');
}
export function walkFiles(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Distribution must not contain symlinks: ${path}`);
    return entry.isDirectory() ? walkFiles(root, path) : [path];
  });
}
export function assertPrepared(packageRoot, manifest) {
  const required = [manifest.main, manifest.types, manifest.source ?? manifest.exports?.['.']?.source, 'nitrogen/generated', 'android/build.gradle', 'android/CMakeLists.txt', 'ios', 'nitro.json', 'LICENSE'].filter(Boolean);
  for (const file of required) {
    if (!existsSync(join(packageRoot, safeRelative(file)))) throw new Error(`${manifest.name}: prepared file missing: ${file}`);
  }
  if (manifest.name === '@onekeyfe/react-native-native-list') {
    const patchedFiles = ['nitrogen/generated/android/kotlin/com/margelo/nitro/nativelist/views/HybridNativeListManager.kt', 'nitrogen/generated/ios/c++/views/HybridNativeListComponent.mm'];
    for (const file of patchedFiles) {
      if (!readFileSync(join(packageRoot, file), 'utf8').includes('// NativeList container slot mounting')) throw new Error(`Unpatched Nitro container slots: ${file}`);
    }
  }
}
function generatorVersions(root) {
  const readVersion = (name) => JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
  return { node: process.version, yarn: run('corepack', ['yarn', '--version'], root), nitrogen: readVersion('nitrogen'), bob: readVersion('react-native-builder-bob'), typescript: readVersion('typescript') };
}
export function verifyDistribution(root, { publish = false } = {}) {
  const provenance = JSON.parse(readFileSync(join(root, provenanceName), 'utf8'));
  const files = walkFiles(root).filter((file) => file !== provenanceName);
  if (JSON.stringify(files.slice().sort()) !== JSON.stringify(Object.keys(provenance.files).sort())) throw new Error('Distribution file set differs from provenance');
  for (const file of files) if (sha256(readFileSync(join(root, file))) !== provenance.files[file]) throw new Error(`Distribution hash mismatch: ${file}`);
  for (const pkg of packages) {
    const manifest = JSON.parse(readFileSync(join(root, pkg.path, 'package.json'), 'utf8'));
    if (manifest.name !== pkg.name || manifest.scripts || manifest.devDependencies || manifest.packageManager) throw new Error(`Unsafe consumer manifest: ${pkg.name}`);
    assertPrepared(join(root, pkg.path), manifest);
  }
  if (publish && (provenance.source.dirty || provenance.resources.some((item) => item.licenseStatus === 'unresolved'))) throw new Error('Publication requires a clean source commit and resolved resource inventory');
  return provenance;
}
export function generateDistribution(output, { root = sourceRoot, allowDirty = false } = {}) {
  output = resolve(output);
  if (output === root || output.startsWith(`${root}${sep}`)) throw new Error('Output must be outside the source checkout');
  if (existsSync(output) && !existsSync(join(output, marker))) throw new Error(`Refusing to replace unmarked directory: ${output}`);
  const dirty = Boolean(run('git', ['status', '--porcelain'], root));
  if (dirty && !allowDirty) throw new Error('Source has uncommitted changes; use --allow-dirty only for local validation');
  mkdirSync(dirname(output), { recursive: true });
  const stage = mkdtempSync(join(dirname(output), '.native-list-dist-stage-'));
  try {
    writeFileSync(join(stage, marker), 'SmartX Native List generated distribution\n');
    writeFileSync(join(stage, 'package.json'), json({ name: '@smartx/native-list-distribution', private: true, version: '0.0.0' }));
    const packaged = [];
    for (const pkg of packages) {
      const packageRoot = join(root, pkg.path);
      const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
      assertPrepared(packageRoot, manifest);
      const report = JSON.parse(run('npm', ['pack', '--dry-run', '--ignore-scripts', '--json', '--workspaces=false'], packageRoot));
      const paths = report[0].files.map(({ path }) => safeRelative(path));
      for (const path of paths) {
        const from = join(packageRoot, path);
        if (!lstatSync(from).isFile()) throw new Error(`Only regular package files are supported: ${from}`);
        const to = join(stage, pkg.path, path);
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to);
      }
      writeFileSync(join(stage, pkg.path, 'package.json'), json(consumerManifest(manifest)));
      assertPrepared(join(stage, pkg.path), manifest);
      packaged.push({ ...pkg, version: manifest.version, files: paths.length });
    }
    const files = walkFiles(stage);
    const resources = files.filter((file) => /\.(ttf|otf|woff2?)$/i.test(file)).map((path) => ({ path, licenseStatus: 'unresolved', note: 'Do not infer font distribution rights from the package license. SmartX templates use consumer-provided IBM Plex fonts.' }));
    const provenance = {
      schemaVersion: 1,
      source: { repository: 'https://github.com/mengjiu-cao/app-modules', branch: run('git', ['branch', '--show-current'], root), commit: run('git', ['rev-parse', 'HEAD'], root), upstreamBaseline, selectedUpstreamCommits: ['5e94f3bd057ca054ae14153e1fa893d3ae1d0eb5'], dirty, inputDigest: sourceFingerprint(root) },
      generators: generatorVersions(root),
      packages: packaged,
      resources,
      licenses: files.filter((file) => /(^|\/)(LICENSE|COPYING|NOTICE)(\.|$)/i.test(file)),
      files: Object.fromEntries(files.map((file) => [file, sha256(readFileSync(join(stage, file)))])),
    };
    writeFileSync(join(stage, provenanceName), json(provenance));
    verifyDistribution(stage);
    const previous = `${stage}-previous`;
    if (existsSync(output)) renameSync(output, previous);
    try { renameSync(stage, output); } catch (error) { if (existsSync(previous)) renameSync(previous, output); throw error; }
    rmSync(previous, { recursive: true, force: true });
    return provenance;
  } finally { rmSync(stage, { recursive: true, force: true }); }
}
export function buildDistribution(output, options = {}) {
  const root = options.root ?? sourceRoot;
  const before = sourceFingerprint(root);
  for (const pkg of packages) run('corepack', ['yarn', 'workspace', pkg.name, 'prepare'], root, true);
  if (sourceFingerprint(root) !== before) throw new Error('Source changed during build; retry to avoid mixing revisions');
  return generateDistribution(output, options);
}
export function publishDistribution(output, { remote = 'https://github.com/mengjiu-cao/app-modules.git', branch = 'arlan/smartx-native-list-dist' } = {}) {
  output = resolve(output);
  const provenance = verifyDistribution(output, { publish: true });
  run('git', ['check-ref-format', '--branch', branch]);
  const temp = mkdtempSync(join(tmpdir(), 'native-list-publish-'));
  try {
    run('git', ['init', '-q', temp]);
    run('git', ['remote', 'add', 'origin', remote], temp);
    const exists = run('git', ['ls-remote', '--heads', 'origin', branch], temp);
    if (exists) {
      run('git', ['fetch', '--depth=1', 'origin', `refs/heads/${branch}`], temp);
      run('git', ['switch', '-c', branch, 'FETCH_HEAD'], temp);
      for (const entry of readdirSync(temp)) if (entry !== '.git') rmSync(join(temp, entry), { recursive: true, force: true });
    } else run('git', ['switch', '--orphan', branch], temp);
    for (const entry of readdirSync(output)) cpSync(join(output, entry), join(temp, entry), { recursive: true });
    run('git', ['add', '--all'], temp);
    if (run('git', ['status', '--porcelain'], temp)) run('git', ['commit', '-m', `build: native list from ${provenance.source.commit}`], temp, true);
    const sha = run('git', ['rev-parse', 'HEAD'], temp);
    run('git', ['push', 'origin', `HEAD:refs/heads/${branch}`], temp, true);
    return sha;
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
export async function main(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { output: { type: 'string' }, watch: { type: 'boolean' }, 'allow-dirty': { type: 'boolean' }, remote: { type: 'string' }, branch: { type: 'string' } } });
  const command = positionals[0] ?? 'build';
  if (!values.output) throw new Error('Usage: native-list-dist.mjs build|verify|publish --output <absolute-directory> [--watch] [--allow-dirty]');
  if (command === 'verify') { console.log(json(verifyDistribution(resolve(values.output)).source)); return; }
  if (command === 'publish') { console.log(publishDistribution(values.output, values)); return; }
  if (command !== 'build') throw new Error(`Unknown command: ${command}`);
  const build = () => { const record = buildDistribution(values.output, { allowDirty: values['allow-dirty'] }); console.log(`Prepared four packages at ${resolve(values.output)} from ${record.source.commit}${record.source.dirty ? ' (local dirty source)' : ''}`); };
  build();
  if (!values.watch) return;
  let previous = sourceFingerprint();
  const timer = setInterval(() => {
    const next = sourceFingerprint();
    if (next === previous) return;
    try { build(); previous = sourceFingerprint(); } catch (error) { previous = next; console.error(error.message); }
  }, 1200);
  process.once('SIGINT', () => clearInterval(timer));
  process.once('SIGTERM', () => clearInterval(timer));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
