import React, { useState } from 'react';
import { registerUser, loginUser, UserProfile } from '../src/config/firebase';

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