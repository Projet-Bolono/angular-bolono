
interface BolonoRuntimeConfig {
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

declare global {
  interface Window {
    __bolonoConfig?: BolonoRuntimeConfig;
  }
}

const localConfig: BolonoRuntimeConfig = {
  apiUrl: 'http://localhost:8080',
  firebase: {
    apiKey: 'AIzaSyBJx2ZiZJ_ZCZY4BlFNikYWXphRGGIKqIA',
    authDomain: 'bolono-2026.firebaseapp.com',
    projectId: 'bolono-2026',
    storageBucket: 'bolono-2026.firebasestorage.app',
    messagingSenderId: '876644842504',
    appId: '',
  },
};

const config = typeof window !== 'undefined' ? window.__bolonoConfig : undefined;

export const environment = {
  production: typeof window !== 'undefined' && config !== undefined,
  ...(config ?? localConfig),
};
