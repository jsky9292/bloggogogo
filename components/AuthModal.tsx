import React, { useState } from 'react';
import { registerUser, loginUser, loginWithGoogle, UserProfile } from '../src/config/firebase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const userProfile = await loginWithGoogle();

            // localStorage에 저장 (호환성 유지)
            const userData = {
                id: userProfile.uid,
                uid: userProfile.uid,
                email: userProfile.email,
                name: userProfile.name,
                plan: userProfile.plan,
                role: userProfile.role,
                apiKey: userProfile.apiKey
            };
            localStorage.setItem('user', JSON.stringify(userData));
            onSuccess(userData);
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Google 로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let userProfile: UserProfile;

            if (mode === 'login') {
                // Firebase 로그인
                userProfile = await loginUser(email, password);
            } else {
                // Firebase 회원가입
                if (!name.trim()) {
                    setError('이름을 입력해주세요.');
                    setLoading(false);
                    return;
                }
                userProfile = await registerUser(email, password, name);
            }

            // localStorage에 저장 (호환성 유지)
            const userData = {
                id: userProfile.uid,
                uid: userProfile.uid,  // uid 추가
                email: userProfile.email,
                name: userProfile.name,
                plan: userProfile.plan,
                role: userProfile.role,
                apiKey: userProfile.apiKey
            };
            localStorage.setItem('user', JSON.stringify(userData));
            onSuccess(userData);
        } catch (err: any) {
            console.error('Auth error:', err);
            if (err.message.includes('auth/email-already-in-use')) {
                setError('이미 사용 중인 이메일입니다.');
            } else if (err.message.includes('auth/weak-password')) {
                setError('비밀번호는 최소 6자 이상이어야 합니다.');
            } else if (err.message.includes('auth/invalid-email')) {
                setError('유효한 이메일 주소를 입력해주세요.');
            } else if (err.message.includes('auth/user-not-found')) {
                setError('등록되지 않은 이메일입니다.');
            } else if (err.message.includes('auth/wrong-password')) {
                setError('비밀번호가 올바르지 않습니다.');
            } else {
                setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {mode === 'login' ? '로그인' : '회원가입'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 회원가입 유도 안내 */}
                    {mode === 'login' && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>처음 방문하셨나요?</strong><br />
                                회원가입 후 무료로 서비스를 이용해보세요!<br />
                                매일 10회 무료 검색이 제공됩니다.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    이름
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50"
                        >
                            {loading ? '처리중...' : (mode === 'login' ? '로그인' : '회원가입')}
                        </button>
                    </form>

                    {/* 구분선 */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">또는</span>
                        </div>
                    </div>

                    {/* 소셜 로그인 버튼들 */}
                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-gray-700 font-medium">Google로 계속하기</span>
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {mode === 'login' ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
                        </button>
                    </div>

                    {mode === 'register' && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">무료 플랜 혜택:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• 일일 10회 키워드 분석</li>
                                <li>• 기본 경쟁력 분석</li>
                                <li>• 검색 기록 저장</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;