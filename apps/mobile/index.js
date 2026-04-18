// Monorepo entry shim: expo-router/entry lives in the workspace root's
// node_modules, but the Expo CLI resolves the package.json#main field
// before Metro's nodeModulesPaths takes effect. Using a relative path
// here bypasses module-name resolution entirely.
import '../../node_modules/expo-router/entry';
