const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'gif', 'webp', 'pdf', 'mp4', 'mov', 'avi'],
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx', 'svg'],
  },
};

// First merge the default config with your custom config
const mergedConfig = mergeConfig(getDefaultConfig(__dirname), config);

// Then wrap the merged config with Reanimated's wrapper
module.exports = wrapWithReanimatedMetroConfig(mergedConfig);