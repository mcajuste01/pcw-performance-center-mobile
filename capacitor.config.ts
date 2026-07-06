import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.platinumchampionshipwrestling.academy',
  appName: 'PCW Performance Center',
  webDir: 'dist',
  server: {
    url: 'https://academy.platinumchampionshipwrestling.com',
    cleartext: false
  }
};

export default config;