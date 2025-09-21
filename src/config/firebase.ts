import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Firebase 설정 - 환경 변수에서 가져오기
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB9OTHfn8ys8kC_9TWikwQegLfb3oJuKpE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'keyword-insight-pro.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'keyword-insight-pro',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'keyword-insight-pro.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '814882225550',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:814882225550:web:275de97363373b3f3eb8df'
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

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
  apiKey?: string;
  usage?: {
    searches: number;
    lastReset: Date;
  };
}

// 회원가입 함수
export const registerUser = async (email: string, password: string, name: string): Promise<UserProfile> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에 사용자 프로필 생성
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      name: name,
      plan: 'free',
      role: 'user',
      createdAt: new Date(),
      usage: {
        searches: 0,
        lastReset: new Date()
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
    const usage = userData.usage?.searches || 0;
    const lastReset = userData.usage?.lastReset || new Date();

    // 일일 제한 체크
    const now = new Date();
    const daysSinceReset = (now.getTime() - new Date(lastReset).getTime()) / (1000 * 60 * 60 * 24);

    // 하루가 지났으면 리셋
    if (daysSinceReset >= 1) {
      await updateUserProfile(uid, {
        usage: {
          searches: 0,
          lastReset: now
        }
      });
      return true;
    }

    // 플랜별 일일 제한
    const limits: Record<string, number> = {
      free: 10,
      basic: 50,
      pro: 200,
      enterprise: Infinity
    };

    return usage < limits[plan];
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