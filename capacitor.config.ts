import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.platinumchampionshipwrestling.academy',
  appName: 'PCW Performance Center',
  webDir: 'dist',
  server: {
    url: 'https://academy.platinumchampionshipwrestling.com',
    cleartext: false,
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'base44.app',
      '*.base44.app'
    ]
  },
  android: {
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  }
};

export default config;