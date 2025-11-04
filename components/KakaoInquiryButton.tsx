import React from 'react';

const KakaoInquiryButton: React.FC = () => {
    const handleClick = () => {
        window.open('https://open.kakao.com/o/sOgR5TZh', '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            onClick={handleClick}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#FEE500',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                transition: 'all 0.3s ease',
                padding: '0'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            aria-label="카카오톡 1:1 문의"
        >
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M16 4C9.373 4 4 8.373 4 13.778c0 3.556 2.311 6.689 5.778 8.533-.222 1.778-.889 4.222-1.111 4.889-.044.133-.089.311.044.444.089.089.222.133.356.133.178 0 2.044-.133 4.044-1.244.622.089 1.289.178 1.956.178 6.627 0 12-4.4 12-9.778C28 8.373 22.627 4 16 4z"
                    fill="#3C1E1E"
                />
            </svg>
            <div
                style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: '0',
                    backgroundColor: '#3C1E1E',
                    color: '#FEE500',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: '0',
                    pointerEvents: 'none',
                    transition: 'opacity 0.3s ease'
                }}
                className="kakao-tooltip"
            >
                1:1 문의하기
            </div>
            <style>{`
                button:hover .kakao-tooltip {
                    opacity: 1 !important;
                }

                @media (max-width: 768px) {
                    button {
                        bottom: 16px !important;
                        right: 16px !important;
                        width: 56px !important;
                        height: 56px !important;
                    }

                    button svg {
                        width: 28px !important;
                        height: 28px !important;
                    }
                }
            `}</style>
        </button>
    );
};

export default KakaoInquiryButton;
