import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.netlify.trackerhub',
  appName: 'TrackeHub',
  webDir: 'dist',
  plugins: {
    Deploy: {
      appId: 'dc43bdc7',
      channel: 'production',
      updateMethod: 'background'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    StatusBar: {
      overlaysWebView: false
    }
  },
  // Deep link handling for OAuth
  android: {
    allowMixedContent: true
  }
};

export default config;
