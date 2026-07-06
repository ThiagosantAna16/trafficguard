module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54) já injeta o plugin de worklets do Reanimated 4
    presets: ['babel-preset-expo'],
  };
};
