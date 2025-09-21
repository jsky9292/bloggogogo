import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

interface ApiKeySettingsProps {
    onApiKeyUpdate?: (key: string) => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeyUpdate }) => {
    const [showModal, setShowModal] = useState(false);
    const [geminiKey, setGeminiKey] = useState('');
    const [claudeKey, setClaudeKey] = useState('');
    const [chatgptKey, setChatgptKey] = useState('');
    const [savedGeminiKey, setSavedGeminiKey] = useState('');
    const [savedClaudeKey, setSavedClaudeKey] = useState('');
    const [savedChatgptKey, setSavedChatgptKey] = useState('');
    const [showKeys, setShowKeys] = useState({
        gemini: false,
        claude: false,
        chatgpt: false
    });

    useEffect(() => {
        // localStorage에서 API 키들 가져오기
        const storedGeminiKey = localStorage.getItem('gemini_api_key');
        const storedClaudeKey = localStorage.getItem('claude_api_key');
        const storedChatgptKey = localStorage.getItem('chatgpt_api_key');
        
        if (storedGeminiKey) {
            setSavedGeminiKey(storedGeminiKey);
            setGeminiKey(storedGeminiKey);
        }
        if (storedClaudeKey) {
            setSavedClaudeKey(storedClaudeKey);
            setClaudeKey(storedClaudeKey);
        }
        if (storedChatgptKey) {
            setSavedChatgptKey(storedChatgptKey);
            setChatgptKey(storedChatgptKey);
        }
    }, []);

    const handleSave = async () => {
        let saved = false;

        // 현재 로그인한 사용자 정보 가져오기
        const userStr = localStorage.getItem('user');
        console.log('localStorage에서 가져온 user 문자열:', userStr);
        const currentUser = userStr ? JSON.parse(userStr) : null;
        console.log('파싱된 currentUser:', currentUser);

        if (geminiKey) {
            localStorage.setItem('gemini_api_key', geminiKey);
            setSavedGeminiKey(geminiKey);
            saved = true;

            // Firestore에도 저장
            // 관리자인 경우 강제로 관리자 UID 사용
            const adminUID = 'zFZyqKsVYTNfUqE4RIXyihd3wjp1';
            const targetUID = (currentUser && currentUser.uid) ? currentUser.uid : adminUID;

            if (targetUID) {
                try {
                    console.log('ApiKeySettings: Firestore에 API 키 저장 중...');
                    console.log('현재 localStorage user:', currentUser);
                    console.log('사용자 UID:', currentUser?.uid);
                    console.log('사용할 타겟 UID:', targetUID);
                    console.log('관리자 실제 UID: zFZyqKsVYTNfUqE4RIXyihd3wjp1');
                    console.log('저장할 API 키:', geminiKey?.substring(0, 10) + '...');

                    await updateDoc(doc(db, 'users', targetUID), {
                        apiKey: geminiKey,
                        updatedAt: new Date()
                    });

                    console.log('ApiKeySettings: Firestore 저장 완료');
                } catch (error) {
                    console.error('Error saving API key to Firestore:', error);
                }
            } else {
                console.log('ApiKeySettings: targetUID 없음 - Firestore 저장 불가');
                console.log('currentUser:', currentUser);
                console.log('targetUID:', targetUID);
            }
        }
        if (claudeKey) {
            localStorage.setItem('claude_api_key', claudeKey);
            setSavedClaudeKey(claudeKey);
            saved = true;
        }
        if (chatgptKey) {
            localStorage.setItem('chatgpt_api_key', chatgptKey);
            setSavedChatgptKey(chatgptKey);
            saved = true;
        }
        
        if (saved) {
            setShowModal(false);
            if (onApiKeyUpdate) {
                console.log('ApiKeySettings: onApiKeyUpdate 콜백 호출 중...', geminiKey ? '키 있음' : '키 없음');
                onApiKeyUpdate(geminiKey); // 기본적으로 Gemini 키를 전달
            } else {
                console.log('ApiKeySettings: onApiKeyUpdate 콜백이 없습니다.');
            }
            alert('API 키가 저장되었습니다. 페이지를 새로고침하면 적용됩니다.');
        }
    };

    const maskApiKey = (key: string) => {
        if (!key) return '';
        return key.substring(0, 10) + '...' + key.substring(key.length - 4);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                API 키 설정
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">API 키 설정</h2>
                            
                            {/* Gemini API Key */}
                            <div className="mb-6 border-b pb-4">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="text-blue-600 mr-2">🔷</span>
                                    Gemini API
                                </h3>
                                
                                {savedGeminiKey && (
                                    <div className="mb-3 p-3 bg-gray-100 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">현재 저장된 키:</p>
                                        <p className="text-sm font-mono text-gray-800">
                                            {showKeys.gemini ? savedGeminiKey : maskApiKey(savedGeminiKey)}
                                        </p>
                                        <button
                                            onClick={() => setShowKeys({...showKeys, gemini: !showKeys.gemini})}
                                            className="mt-2 text-xs text-blue-800 hover:text-blue-900"
                                        >
                                            {showKeys.gemini ? '숨기기' : '보기'}
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="text"
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        <a 
                                            href="https://makersuite.google.com/app/apikey" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-800 hover:text-blue-900 underline"
                                        >
                                            여기
                                        </a>
                                        에서 Gemini API 키를 발급받을 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            {/* Claude API Key */}
                            <div className="mb-6 border-b pb-4">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="text-orange-600 mr-2">🟠</span>
                                    Claude API
                                </h3>
                                
                                {savedClaudeKey && (
                                    <div className="mb-3 p-3 bg-gray-100 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">현재 저장된 키:</p>
                                        <p className="text-sm font-mono text-gray-800">
                                            {showKeys.claude ? savedClaudeKey : maskApiKey(savedClaudeKey)}
                                        </p>
                                        <button
                                            onClick={() => setShowKeys({...showKeys, claude: !showKeys.claude})}
                                            className="mt-2 text-xs text-blue-800 hover:text-blue-900"
                                        >
                                            {showKeys.claude ? '숨기기' : '보기'}
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="text"
                                        value={claudeKey}
                                        onChange={(e) => setClaudeKey(e.target.value)}
                                        placeholder="sk-ant-api..."
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        <a 
                                            href="https://console.anthropic.com/settings/keys" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-800 hover:text-blue-900 underline"
                                        >
                                            여기
                                        </a>
                                        에서 Claude API 키를 발급받을 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            {/* ChatGPT API Key */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="text-green-600 mr-2">🟢</span>
                                    ChatGPT (OpenAI) API
                                </h3>
                                
                                {savedChatgptKey && (
                                    <div className="mb-3 p-3 bg-gray-100 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">현재 저장된 키:</p>
                                        <p className="text-sm font-mono text-gray-800">
                                            {showKeys.chatgpt ? savedChatgptKey : maskApiKey(savedChatgptKey)}
                                        </p>
                                        <button
                                            onClick={() => setShowKeys({...showKeys, chatgpt: !showKeys.chatgpt})}
                                            className="mt-2 text-xs text-blue-800 hover:text-blue-900"
                                        >
                                            {showKeys.chatgpt ? '숨기기' : '보기'}
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="text"
                                        value={chatgptKey}
                                        onChange={(e) => setChatgptKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        <a 
                                            href="https://platform.openai.com/api-keys" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-800 hover:text-blue-900 underline"
                                        >
                                            여기
                                        </a>
                                        에서 OpenAI API 키를 발급받을 수 있습니다.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
                                >
                                    저장
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApiKeySettings;