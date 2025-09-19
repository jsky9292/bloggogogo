import React, { useState } from 'react';

interface CopyButtonProps {
    textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation(); // Prevent parent button's onClick event
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }, (err) => {
            console.error('Failed to copy text: ', err);
            alert('텍스트 복사에 실패했습니다.');
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors shrink-0"
            aria-label={isCopied ? "복사됨" : "클립보드로 복사"}
            title={isCopied ? "복사 완료!" : "복사하기"}
        >
            {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )}
        </button>
    );
};

export default CopyButton;
