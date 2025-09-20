// Firebase Admin SDK를 사용한 테스트 계정 생성 스크립트
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase 설정 (환경 변수에서 가져오기)
const firebaseConfig = {
  apiKey: "AIzaSyB9OTHfn8ys8kC_9TWikwQegLfb3oJuKpE",
  authDomain: "keyword-insight-pro.firebaseapp.com",
  projectId: "keyword-insight-pro",
  storageBucket: "keyword-insight-pro.appspot.com",
  messagingSenderId: "814882225550",
  appId: "1:814882225550:web:275de97363373b3f3eb8df"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 테스트 계정 데이터
const testAccounts = [
  // Free 플랜 사용자 (5명)
  { email: 'test.free1@bloggogogo.com', password: 'Test123!@#', name: '김민수', plan: 'free' },
  { email: 'test.free2@bloggogogo.com', password: 'Test123!@#', name: '이영희', plan: 'free' },
  { email: 'test.free3@bloggogogo.com', password: 'Test123!@#', name: '박철수', plan: 'free' },
  { email: 'test.free4@bloggogogo.com', password: 'Test123!@#', name: '최지은', plan: 'free' },
  { email: 'test.free5@bloggogogo.com', password: 'Test123!@#', name: '정다은', plan: 'free' },

  // Basic 플랜 사용자 (5명)
  { email: 'test.basic1@bloggogogo.com', password: 'Test123!@#', name: '강민준', plan: 'basic' },
  { email: 'test.basic2@bloggogogo.com', password: 'Test123!@#', name: '윤서연', plan: 'basic' },
  { email: 'test.basic3@bloggogogo.com', password: 'Test123!@#', name: '임하준', plan: 'basic' },
  { email: 'test.basic4@bloggogogo.com', password: 'Test123!@#', name: '송예은', plan: 'basic' },
  { email: 'test.basic5@bloggogogo.com', password: 'Test123!@#', name: '조수진', plan: 'basic' },

  // Pro 플랜 사용자 (5명)
  { email: 'test.pro1@bloggogogo.com', password: 'Test123!@#', name: '한동욱', plan: 'pro' },
  { email: 'test.pro2@bloggogogo.com', password: 'Test123!@#', name: '문소정', plan: 'pro' },
  { email: 'test.pro3@bloggogogo.com', password: 'Test123!@#', name: '배준호', plan: 'pro' },
  { email: 'test.pro4@bloggogogo.com', password: 'Test123!@#', name: '신예림', plan: 'pro' },
  { email: 'test.pro5@bloggogogo.com', password: 'Test123!@#', name: '오태양', plan: 'pro' },

  // Enterprise 플랜 사용자 (3명)
  { email: 'test.enterprise1@bloggogogo.com', password: 'Test123!@#', name: '황대표', plan: 'enterprise' },
  { email: 'test.enterprise2@bloggogogo.com', password: 'Test123!@#', name: '서이사', plan: 'enterprise' },
  { email: 'test.enterprise3@bloggogogo.com', password: 'Test123!@#', name: '노전무', plan: 'enterprise' },

  // 데모 계정 (2명)
  { email: 'demo@bloggogogo.com', password: 'Demo123!@#', name: '데모사용자', plan: 'pro' },
  { email: 'guest@bloggogogo.com', password: 'Guest123!@#', name: '게스트', plan: 'basic' }
];

// 계정 생성 함수
async function createTestAccount(accountData) {
  try {
    // Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      accountData.email,
      accountData.password
    );

    const user = userCredential.user;

    // Firestore에 사용자 프로필 생성
    const userProfile = {
      uid: user.uid,
      email: accountData.email,
      name: accountData.name,
      plan: accountData.plan,
      role: 'user',
      createdAt: new Date(),
      usage: {
        searches: 0,
        lastReset: new Date()
      }
    };

    // 플랜별 구독 정보 추가
    if (accountData.plan !== 'free') {
      userProfile.subscriptionStart = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      userProfile.subscriptionEnd = endDate;
    }

    await setDoc(doc(db, 'users', user.uid), userProfile);

    console.log(`✅ 생성 완료: ${accountData.email} (${accountData.plan} 플랜)`);
    return { success: true, email: accountData.email };

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ 이미 존재: ${accountData.email}`);
      return { success: false, email: accountData.email, error: '이미 존재하는 계정' };
    } else {
      console.error(`❌ 생성 실패: ${accountData.email}`, error.message);
      return { success: false, email: accountData.email, error: error.message };
    }
  }
}

// 모든 테스트 계정 생성
async function createAllTestAccounts() {
  console.log('📋 테스트 계정 생성을 시작합니다...\n');
  console.log(`총 ${testAccounts.length}개의 계정을 생성합니다.\n`);

  const results = {
    success: [],
    failed: [],
    existing: []
  };

  for (const account of testAccounts) {
    const result = await createTestAccount(account);

    if (result.success) {
      results.success.push(result.email);
    } else if (result.error === '이미 존재하는 계정') {
      results.existing.push(result.email);
    } else {
      results.failed.push(result.email);
    }

    // API 제한을 피하기 위해 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 결과 요약 출력
  console.log('\n========================================');
  console.log('📊 테스트 계정 생성 완료!');
  console.log('========================================\n');

  console.log(`✅ 성공적으로 생성된 계정: ${results.success.length}개`);
  if (results.success.length > 0) {
    results.success.forEach(email => console.log(`   - ${email}`));
  }

  if (results.existing.length > 0) {
    console.log(`\n⚠️ 이미 존재하는 계정: ${results.existing.length}개`);
    results.existing.forEach(email => console.log(`   - ${email}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ 생성 실패한 계정: ${results.failed.length}개`);
    results.failed.forEach(email => console.log(`   - ${email}`));
  }

  console.log('\n========================================');
  console.log('💡 테스트 계정 정보:');
  console.log('========================================');
  console.log('공통 비밀번호: Test123!@#');
  console.log('데모 계정: demo@bloggogogo.com / Demo123!@#');
  console.log('게스트 계정: guest@bloggogogo.com / Guest123!@#');
  console.log('\n플랜별 계정:');
  console.log('- Free: test.free1~5@bloggogogo.com');
  console.log('- Basic: test.basic1~5@bloggogogo.com');
  console.log('- Pro: test.pro1~5@bloggogogo.com');
  console.log('- Enterprise: test.enterprise1~3@bloggogogo.com');

  process.exit(0);
}

// 스크립트 실행
createAllTestAccounts().catch(error => {
  console.error('스크립트 실행 중 오류 발생:', error);
  process.exit(1);
});