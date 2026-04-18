module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@mathdle/core": "../../packages/core/src/index.ts",
          },
          extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
      ],
    ],
  };
};
