module.exports = {
  packagerConfig: { asar: true, executableName: 'QuietReader' },
  makers: [{ name: '@electron-forge/maker-zip', platforms: ['win32'] }],
  plugins: [{ name: '@electron-forge/plugin-vite', config: {
    build: [
      { entry: 'src/main/main.ts', config: 'vite.main.config.mjs' },
      { entry: 'src/preload/preload.ts', config: 'vite.preload.config.mjs' }
    ],
    renderer: [{ name: 'main_window', config: 'vite.renderer.config.mjs' }]
  } }]
};
