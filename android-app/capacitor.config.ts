import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.jeanpiaget.soypiaget',
  appName: 'Soy Piaget',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'www.soypiaget.app',
      'soypiaget.app',
      '*.supabase.co',
      'cdn.jsdelivr.net',
      'unpkg.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#07142f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07142f',
      overlaysWebView: false
    },
    Camera: {
      permissions: ['camera', 'photos']
    }
  },
  android: {
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    captureInput: true
  }
};

export default config;
