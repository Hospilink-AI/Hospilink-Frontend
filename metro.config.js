const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Force correct platform file resolution
config.resolver.platforms = ["web", "ios", "android", "native"];

config.resolver.unstable_enablePackageExports = true;

// Redirect react-native-maps to mock on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    moduleName === "react-native-maps"
  ) {
    return {
      filePath: path.resolve(__dirname, "src/mocks/react-native-maps.web.js"),
      type: "sourceFile",
    };
  }
  // Default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;