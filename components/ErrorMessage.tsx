
import React from 'react';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
    // 503 에러 또는 과부하 에러 감지
    const isOverloadError = message.includes('과부하') ||
                           message.includes('overload') ||
                           message.includes('503');

    return (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">⚠️ 오류 발생! </strong>
            <span className="block sm:inline mb-2">{message}</span>

            {isOverloadError && (
                <div className="mt-3 pt-3 border-t border-red-700">
                    <p className="text-sm text-red-200 mb-2">
                        💡 <strong>해결 방법:</strong>
                    </p>
                    <ul className="text-sm text-red-200 list-disc list-inside space-y-1">
                        <li>1-2분 후 다시 시도해주세요</li>
                        <li>개인 Gemini API 키를 사용하는 경우, 할당량을 확인해주세요</li>
                        <li>문제가 지속되면 잠시 후 다시 방문해주세요</li>
                    </ul>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
                        >
                            🔄 다시 시도
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ErrorMessage;
