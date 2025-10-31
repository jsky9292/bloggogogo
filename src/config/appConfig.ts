// 앱 설정 - 로컬 모드와 SaaS 모드 전환
export interface AppConfig {
  mode: 'local' | 'saas';
  apiEndpoint?: string;
  features: {
    requireAuth: boolean;
    showPricing: boolean;
    trackUsage: boolean;
    allowLocalApiKeys: boolean;
  };
}

// 기본 설정 (로컬 모드)
export const defaultConfig: AppConfig = {
  mode: 'local',
  features: {
    requireAuth: false,
    showPricing: false,
    trackUsage: false,
    allowLocalApiKeys: true
  }
};

// SaaS 모드 설정
export const saasConfig: AppConfig = {
  mode: 'saas',
  apiEndpoint: process.env.VITE_API_ENDPOINT || 'http://localhost:5000/api',
  features: {
    requireAuth: true,
    showPricing: true,
    trackUsage: true,
    allowLocalApiKeys: false // SaaS 모드에서는 서버에서 API 키 관리
  }
};

// 현재 모드 가져오기 (환경변수 또는 localStorage)
export const getCurrentConfig = (): AppConfig => {
  // Vite는 import.meta.env 사용 (process.env 아님!)
  const envMode = import.meta.env.VITE_APP_MODE;
  const localMode = localStorage.getItem('app_mode');

  // 우선순위: localStorage > 환경변수 > 기본값(local)
  const mode = localMode || envMode || 'local';

  console.log('[appConfig] mode 결정:', {
    localStorage: localMode,
    envVariable: envMode,
    final: mode
  });

  if (mode === 'saas') {
    return saasConfig;
  }

  return defaultConfig;
};

// 모드 전환
export const switchMode = (mode: 'local' | 'saas') => {
  localStorage.setItem('app_mode', mode);
  window.location.reload(); // 모드 변경 시 새로고침
};

// 현재 설정
export const config = getCurrentConfig();