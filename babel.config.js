// babel.config.js
module.exports = function (api) {
    api.cache(true);

    return {
        presets: [
            // Expo preset, with NativeWind JSX transform
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            // NativeWind v4 uses this as a *preset*, not a plugin
            'nativewind/babel',
        ],

        plugins: [
            // dotenv
            [
                'module:react-native-dotenv',
                {
                    moduleName: '@env',
                    path: '.env',
                    safe: false,
                    allowUndefined: true,
                },
            ],

            // Worklets core for VisionCamera frame processors
            ['react-native-worklets-core/plugin'],

            // Reanimated MUST be last
            'react-native-reanimated/plugin',
        ],
    };
};
