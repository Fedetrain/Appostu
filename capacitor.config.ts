import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.federico.traina',
  appName: 'Appostu',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#ffffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    LocalNotifications: {
      smallIcon: "icon_notification",
    },
    GoogleAuth: {
      serverClientId: "175265749386-07c82f8tcdmgltsbilki0fnnspaam1tj.apps.googleusercontent.com",
    },
  }
  
};

export default config;
