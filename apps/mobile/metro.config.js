const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (needed for packages/core)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// 2. Let Metro resolve from both project and root node_modules
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Replace heavy mathjs (~900 files) with a lightweight stub.
//    This cuts initial bundle time from ~60 s to ~5 s.
const mathjsStub = path.resolve(projectRoot, "mocks/mathjs-lite.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "mathjs") {
    return { filePath: mathjsStub, type: "sourceFile" };
  }
  // Fall through to default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
