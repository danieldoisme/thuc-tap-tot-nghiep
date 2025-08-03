const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [monorepoRoot],

  resolver: {
    nodeModulesPaths: [path.resolve(monorepoRoot, 'node_modules')],
    disableHierarchicalLookup: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);
