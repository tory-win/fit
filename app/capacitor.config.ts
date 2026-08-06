import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.ipfit.mobile',
  appName: '입핏',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      presentationOptions: ['banner', 'list'],
    },
    // 런치 스토리보드만으로는 웹이 뜨는 동안 흰 화면이 보인다.
    // 앱이 준비됐다고 알릴 때까지 스플래시를 잡아 둔다 — App.tsx 의 hideSplash.
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#f7f2e9',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
  ios: {
    backgroundColor: '#f7f2e9',
  },
}

export default config
