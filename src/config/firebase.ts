import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase 설정 - 환경 변수에서만 가져오기 (보안)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 네이버 API 키 타입 정의
export interface NaverApiKeys {
  adApiKey: string;
  adSecretKey: string;
  adCustomerId: string;
  searchClientId: string;
  searchClientSecret: string;
}

// 사용자 타입 정의
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  role: 'user' | 'admin';
  createdAt: Date;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  subscriptionDays?: number; // 구독 일수 추가
  apiKey?: string;
  naverApiKeys?: NaverApiKeys; // 네이버 API 키 추가
  usage?: {
    searches: number;
    lastReset: Date;
  };
  dailyUsage?: {
    keywordSearches: number;
    blogGenerations: number;
    lastResetDate: string; // YYYY-MM-DD 형식
  };
}

// 플랜별 일일 사용량 제한
export const PLAN_DAILY_LIMITS = {
  free: { keywordSearches: 10, blogGenerations: 1 },
  basic: { keywordSearches: 30, blogGenerations: 10 },
  pro: { keywordSearches: 100, blogGenerations: -1 }, // -1 = 무제한
  enterprise: { keywordSearches: -1, blogGenerations: -1 } // -1 = 무제한
};

// 회원가입 함수
export const registerUser = async (email: string, password: string, name: string): Promise<UserProfile> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 7일 무료 체험 기간 설정
    const now = new Date();
    const freeEndDate = new Date();
    freeEndDate.setDate(freeEndDate.getDate() + 7);

    // Firestore에 사용자 프로필 생성
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      name: name,
      plan: 'free',
      role: 'user',
      createdAt: now,
      subscriptionStart: now,
      subscriptionEnd: freeEndDate,
      subscriptionDays: 7,
      usage: {
        searches: 0,
        lastReset: now
      }
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    return userProfile;
  } catch (error: any) {
    throw new Error(error.message || '회원가입 중 오류가 발생했습니다.');
  }
};

// 로그인 함수
export const loginUser = async (email: string, password: string): Promise<UserProfile> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에서 사용자 프로필 가져오기
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      let profile = userDoc.data() as UserProfile;

      // 관리자 계정이면 강제로 Enterprise 플랜으로 설정
      if (email === 'admin@keywordinsight.com') {
        profile = {
          ...profile,
          plan: 'enterprise',
          role: 'admin',
          name: '관리자'
        };
        // DB 업데이트
        await updateDoc(doc(db, 'users', user.uid), {
          plan: 'enterprise',
          role: 'admin',
          name: '관리자'
        });
      }

      // API 키가 있으면 localStorage에 저장
      if (profile.apiKey) {
        localStorage.setItem('gemini_api_key', profile.apiKey);
      }

      // 네이버 API 키가 있으면 localStorage에 저장
      if (profile.naverApiKeys) {
        localStorage.setItem('naverApiKeys', JSON.stringify(profile.naverApiKeys));
      }

      return profile;
    } else {
      // 프로필이 없으면 생성 (기존 사용자의 경우)
      // 관리자 계정 체크
      const isAdmin = email === 'admin@keywordinsight.com';

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        name: isAdmin ? '관리자' : (user.displayName || email.split('@')[0]),
        plan: isAdmin ? 'enterprise' : 'free',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date(),
        usage: {
          searches: 0,
          lastReset: new Date()
        }
      };
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    }
  } catch (error: any) {
    throw new Error(error.message || '로그인 중 오류가 발생했습니다.');
  }
};

// Google 로그인 함수
export const loginWithGoogle = async (): Promise<UserProfile> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Firestore에서 사용자 프로필 확인
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;

      // API 키가 있으면 localStorage에 저장
      if (profile.apiKey) {
        localStorage.setItem('gemini_api_key', profile.apiKey);
      }

      // 네이버 API 키가 있으면 localStorage에 저장
      if (profile.naverApiKeys) {
        localStorage.setItem('naverApiKeys', JSON.stringify(profile.naverApiKeys));
      }

      return profile;
    } else {
      // 신규 사용자 프로필 생성 (7일 무료 체험)
      const now = new Date();
      const freeEndDate = new Date();
      freeEndDate.setDate(freeEndDate.getDate() + 7);

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Google 사용자',
        plan: 'free',
        role: 'user',
        createdAt: now,
        subscriptionStart: now,
        subscriptionEnd: freeEndDate,
        subscriptionDays: 7,
        usage: {
          searches: 0,
          lastReset: now
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('로그인이 취소되었습니다.');
    }
    throw new Error(error.message || 'Google 로그인 중 오류가 발생했습니다.');
  }
};

// 로그아웃 함수
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || '로그아웃 중 오류가 발생했습니다.');
  }
};

// 인증 상태 관찰 함수
export const observeAuthState = (callback: (user: UserProfile | null) => void) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as UserProfile);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), updates, { merge: true });
  } catch (error: any) {
    throw new Error(error.message || '프로필 업데이트 중 오류가 발생했습니다.');
  }
};

// 사용량 체크 함수
export const checkUsageLimit = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data() as UserProfile;
    const plan = userData.plan;

    // Enterprise는 항상 무제한
    if (plan === 'enterprise') {
      return true;
    }

    // 구독 종료일이 없으면 사용 불가 (Enterprise 제외)
    if (!userData.subscriptionEnd) {
      console.log(`[checkUsageLimit] ${userData.email}: 구독 종료일 없음 - 차단`);
      return false;
    }

    // 구독 만료 체크 (Free, Basic, Pro 모두 동일)
    const now = new Date();

    // Firestore Timestamp를 Date로 변환
    const endDate = userData.subscriptionEnd instanceof Date
      ? userData.subscriptionEnd
      : (userData.subscriptionEnd as any).toDate
        ? (userData.subscriptionEnd as any).toDate()
        : new Date(userData.subscriptionEnd);

    console.log(`[checkUsageLimit] ${userData.email}: 플랜=${plan}, 만료일=${endDate.toISOString()}, 현재=${now.toISOString()}`);

    // 구독이 만료되었으면 차단
    if (now > endDate) {
      console.log(`[checkUsageLimit] ${userData.email}: 구독 만료 - 차단`);

      // Free 플랜이 아니면 Free로 변경
      if (plan !== 'free') {
        await updateUserProfile(uid, {
          plan: 'free',
          subscriptionEnd: undefined,
          subscriptionDays: undefined
        });
      }

      return false;
    }

    // 구독 기간 내이면 사용 가능
    console.log(`[checkUsageLimit] ${userData.email}: 구독 유효 - 허용`);
    return true;

  } catch (error) {
    console.error('Usage check error:', error);
    return false;
  }
};

// 사용량 증가 함수
export const incrementUsage = async (uid: string): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as UserProfile;
    const currentUsage = userData.usage?.searches || 0;

    await updateUserProfile(uid, {
      usage: {
        searches: currentUsage + 1,
        lastReset: userData.usage?.lastReset || new Date()
      }
    });
  } catch (error) {
    console.error('Increment usage error:', error);
  }
};

// 관리자 체크 함수
export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data() as UserProfile;
    return userData.role === 'admin';
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
};

// 관리자 계정 업데이트 함수 (관리자 계정이 FREE로 표시되는 문제 수정)
export const updateAdminAccount = async (uid: string, email: string): Promise<void> => {
  try {
    if (email === 'admin@keywordinsight.com') {
      await updateUserProfile(uid, {
        name: '관리자',
        plan: 'enterprise',
        role: 'admin',
        usage: {
          searches: 0,
          lastReset: new Date()
        }
      });
      console.log('Admin account updated successfully');
    }
  } catch (error) {
    console.error('Error updating admin account:', error);
  }
};

// 사용자 구독 기간 업데이트 함수
export const updateUserSubscription = async (uid: string, plan: string, days: number): Promise<void> => {
  try {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    await updateUserProfile(uid, {
      plan: plan as 'free' | 'basic' | 'pro' | 'enterprise',
      subscriptionStart: now,
      subscriptionEnd: endDate,
      subscriptionDays: days
    });

    console.log(`Subscription updated: ${plan} for ${days} days`);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

// 구독 만료 체크 함수
export const checkSubscriptionExpiry = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data() as UserProfile;

    // Enterprise는 무제한
    if (userData.plan === 'enterprise') return true;

    // 구독 종료일이 설정되어 있지 않으면 false
    if (!userData.subscriptionEnd) return false;

    // 현재 시간과 비교
    const now = new Date();

    // Firestore Timestamp를 Date로 변환
    const endDate = userData.subscriptionEnd instanceof Date
      ? userData.subscriptionEnd
      : (userData.subscriptionEnd as any).toDate
        ? (userData.subscriptionEnd as any).toDate()
        : new Date(userData.subscriptionEnd);

    // 만료되면 free로 변경
    if (now > endDate) {
      await updateUserProfile(uid, {
        plan: 'free',
        subscriptionEnd: undefined,
        subscriptionDays: undefined
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Subscription check error:', error);
    return false;
  }
};

// 네이버 API 키 저장 함수
export const saveNaverApiKeys = async (uid: string, naverApiKeys: NaverApiKeys): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      naverApiKeys
    });

    // localStorage에도 저장
    localStorage.setItem('naverApiKeys', JSON.stringify(naverApiKeys));

    console.log('Naver API keys saved to Firebase and localStorage');
  } catch (error) {
    console.error('Error saving Naver API keys:', error);
    throw error;
  }
};

// 네이버 API 키 가져오기 함수
export const getNaverApiKeys = async (uid: string): Promise<NaverApiKeys | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as UserProfile;
    return userData.naverApiKeys || null;
  } catch (error) {
    console.error('Error getting Naver API keys:', error);
    return null;
  }
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 일일 사용량 초기화가 필요한지 확인
const needsDailyReset = (lastResetDate?: string): boolean => {
  if (!lastResetDate) return true;
  return lastResetDate !== getTodayString();
};

// 일일 사용량 체크 함수
export const checkDailyLimit = async (uid: string, type: 'keywordSearches' | 'blogGenerations'): Promise<{ canUse: boolean; current: number; limit: number }> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return { canUse: false, current: 0, limit: 0 };
    }

    const userData = userDoc.data() as UserProfile;
    const plan = userData.plan;
    const limits = PLAN_DAILY_LIMITS[plan];
    const limit = limits[type];

    // -1은 무제한
    if (limit === -1) {
      return { canUse: true, current: 0, limit: -1 };
    }

    // Enterprise는 무제한
    if (plan === 'enterprise') {
      return { canUse: true, current: 0, limit: -1 };
    }

    // 일일 사용량 초기화 확인
    if (needsDailyReset(userData.dailyUsage?.lastResetDate)) {
      // 날짜가 바뀌었으므로 사용량 초기화
      const newDailyUsage = {
        keywordSearches: 0,
        blogGenerations: 0,
        lastResetDate: getTodayString()
      };

      await updateUserProfile(uid, { dailyUsage: newDailyUsage });

      console.log(`[checkDailyLimit] ${userData.email}: 일일 사용량 초기화됨`);
      return { canUse: true, current: 0, limit };
    }

    // 현재 사용량 확인
    const current = userData.dailyUsage?.[type] || 0;

    console.log(`[checkDailyLimit] ${userData.email}: ${type} = ${current}/${limit} (플랜: ${plan})`);

    if (current >= limit) {
      console.log(`[checkDailyLimit] ${userData.email}: 일일 사용량 초과 - 차단`);
      return { canUse: false, current, limit };
    }

    return { canUse: true, current, limit };

  } catch (error) {
    console.error('Daily limit check error:', error);
    return { canUse: false, current: 0, limit: 0 };
  }
};

// 일일 사용량 증가 함수
export const incrementDailyUsage = async (uid: string, type: 'keywordSearches' | 'blogGenerations'): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as UserProfile;

    // 일일 사용량 초기화 확인
    let dailyUsage = userData.dailyUsage || {
      keywordSearches: 0,
      blogGenerations: 0,
      lastResetDate: getTodayString()
    };

    if (needsDailyReset(dailyUsage.lastResetDate)) {
      dailyUsage = {
        keywordSearches: 0,
        blogGenerations: 0,
        lastResetDate: getTodayString()
      };
    }

    // 사용량 증가
    dailyUsage[type] = (dailyUsage[type] || 0) + 1;

    await updateUserProfile(uid, { dailyUsage });

    console.log(`[incrementDailyUsage] ${userData.email}: ${type} 증가 → ${dailyUsage[type]}`);
  } catch (error) {
    console.error('Increment daily usage error:', error);
  }
};

// 일일 사용량 조회 함수
export const getDailyUsage = async (uid: string): Promise<{ keywordSearches: number; blogGenerations: number; limit: typeof PLAN_DAILY_LIMITS[keyof typeof PLAN_DAILY_LIMITS] } | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as UserProfile;
    const plan = userData.plan;
    const limits = PLAN_DAILY_LIMITS[plan];

    // 일일 사용량 초기화 확인
    if (needsDailyReset(userData.dailyUsage?.lastResetDate)) {
      return {
        keywordSearches: 0,
        blogGenerations: 0,
        limit: limits
      };
    }

    return {
      keywordSearches: userData.dailyUsage?.keywordSearches || 0,
      blogGenerations: userData.dailyUsage?.blogGenerations || 0,
      limit: limits
    };
  } catch (error) {
    console.error('Get daily usage error:', error);
    return null;
  }
};