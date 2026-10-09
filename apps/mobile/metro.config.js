const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// ── Monorepo: watch workspace root, resolve from both node_modules ───────────
config.watchFolders = [
  ...(config.watchFolders ?? []),
  workspaceRoot,
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// ── @gestion-pas/types: point directly at compiled dist ──────────────────────
config.resolver.extraNodeModules = {
  '@gestion-pas/types': path.resolve(workspaceRoot, 'packages/types/dist'),
};

// ── Fix @tanstack/react-query v5 on Hermes ───────────────────────────────────
//
// @expo/metro-config sets resolverMainFields = ['react-native', 'browser', 'main'].
// Both @tanstack/react-query and @tanstack/query-core have:
//   "react-native": "src/index.ts"   ← raw TypeScript — Hermes crashes
//   "main": "build/legacy/index.cjs" ← compiled CJS  — what we want
//
// Strategy:
//   1. Add '.cjs' to sourceExts so Metro can follow require('./foo.cjs') calls
//      inside the compiled build output.
//   2. Use resolveRequest to intercept these two package names and resolve them
//      with a mainFields list that skips 'react-native', so Metro picks 'main'.
config.resolver.sourceExts = [
  'cjs',
  ...(config.resolver.sourceExts ?? ['js', 'jsx', 'ts', 'tsx', 'json']),
];

const _resolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '@tanstack/react-query' ||
    moduleName === '@tanstack/query-core'
  ) {
    // Resolve without the 'react-native' field by overriding mainFields
    return context.resolveRequest(
      {
        ...context,
        mainFields: ['browser', 'main'],
      },
      moduleName,
      platform,
    );
  }

  if (_resolveRequest) {
    return _resolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
