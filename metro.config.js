const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Remove 'svg' from assetExts and add to sourceExts
const assetExts = defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg');
const sourceExts = [...defaultConfig.resolver.sourceExts, 'svg'];

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts,     // Use updated array without svg
    sourceExts,    // Add svg to recognized sourceExts
  },
};

const mergedConfig = mergeConfig(defaultConfig, config);

module.exports = wrapWithReanimatedMetroConfig(mergedConfig);
