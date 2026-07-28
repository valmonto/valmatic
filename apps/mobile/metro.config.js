// Metro config for a pnpm monorepo: watch the workspace root so changes in
// packages/* are picked up, and let Metro resolve from both the app's own
// node_modules and the hoisted workspace node_modules.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm uses symlinks into a virtual store — Metro must follow them.
config.resolver.unstable_enableSymlinks = true;

// `@pkg/contracts` resolves to its client entry: every type, plus the Zod-free
// constants and permission helpers. The root entry re-exports the whole schema
// graph, so importing it here would bundle Zod for the sake of a regex. Screens
// that genuinely validate import `@pkg/contracts/schemas` explicitly — visible
// in review rather than an accident. Subpaths fall through untouched.
const contractsClient = path.resolve(workspaceRoot, 'packages/contracts/src/client/index.ts');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@pkg/contracts') {
    return { type: 'sourceFile', filePath: contractsClient };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

// NativeWind v5: registers the react-native-css transformer and enables the
// global className polyfill. The CSS entry is imported in app code
// (src/app/_layout.tsx), not passed here.
module.exports = withNativeWind(config);
