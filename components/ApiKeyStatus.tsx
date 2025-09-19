import React, { useState, useEffect } from 'react';

const ApiKeyStatus: React.FC = () => {
    const [hasUserApiKey, setHasUserApiKey] = useState(false);
    const [hasDefaultApiKey, setHasDefaultApiKey] = useState(false);

    useEffect(() => {
        // 사용자 API 키 확인
        const userApiKey = localStorage.getItem('gemini_api_key');
        setHasUserApiKey(!!userApiKey && userApiKey.trim().length > 0);

        // 기본 API 키 확인
        const defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY;
        setHasDefaultApiKey(!!defaultApiKey && defaultApiKey.trim().length > 0);
    }, []);

    const getStatusInfo = () => {
        if (hasUserApiKey) {
            return {
                icon: '🔑',
                text: '개인 API 키 사용중',
                subtext: '당신의 개인 API 키로 분석이 수행됩니다',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            };
        } else if (hasDefaultApiKey) {
            return {
                icon: '🔑',
                text: '기본 API 키 사용중',
                subtext: '설정에서 개인 API 키를 등록하면 더 안정적으로 이용할 수 있습니다',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            };
        } else {
            return {
                icon: '⚠️',
                text: 'API 키 필요',
                subtext: '분석 기능 사용을 위해 API 키 설정이 필요합니다',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200'
            };
        }
    };

    const status = getStatusInfo();

    return (
        <div className={`p-3 rounded-lg border ${status.bgColor} ${status.borderColor} mb-4`}>
            <div className="flex items-start gap-3">
                <span className="text-lg">{status.icon}</span>
                <div className="flex-1">
                    <p className={`font-medium ${status.color}`}>
                        {status.text}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {status.subtext}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyStatus;