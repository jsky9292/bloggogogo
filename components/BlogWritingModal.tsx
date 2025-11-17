import React, { useState } from 'react';

interface BlogWritingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: {
        contentFormat?: 'comparison' | 'listicle' | 'guide';
        tone: 'friendly' | 'expert' | 'informative';
        aiModel: 'gemini' | 'claude' | 'chatgpt';
    }) => void;
    platform: 'naver' | 'google';
}

const BlogWritingModal: React.FC<BlogWritingModalProps> = ({ isOpen, onClose, onConfirm, platform }) => {
    const [contentFormat, setContentFormat] = useState<'comparison' | 'listicle' | 'guide'>('guide');
    const [tone, setTone] = useState<'friendly' | 'expert' | 'informative'>('informative');
    const [aiModel, setAiModel] = useState<'gemini' | 'claude' | 'chatgpt'>('gemini');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            contentFormat: platform === 'google' ? contentFormat : undefined,
            tone,
            aiModel
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: '500px',
                padding: '24px'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        margin: 0
                    }}>
                        {platform === 'naver' ? '네이버' : '구글'} 글쓰기 설정
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: '24px',
                            padding: '4px'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{ marginBottom: '24px' }}>
                    {/* 구글 전용: 글 형식 선택 */}
                    {platform === 'google' && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '12px'
                            }}>
                                📝 글 형식 선택
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: contentFormat === 'comparison' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: contentFormat === 'comparison' ? '#eff6ff' : '#ffffff',
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="radio"
                                        name="contentFormat"
                                        value="comparison"
                                        checked={contentFormat === 'comparison'}
                                        onChange={(e) => setContentFormat(e.target.value as 'comparison' | 'listicle' | 'guide')}
                                        style={{ marginRight: '12px' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                            ⚖️ 비교형
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            두 옵션을 비교 분석하는 글 (A vs B, 장단점 비교)
                                        </div>
                                    </div>
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: contentFormat === 'listicle' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: contentFormat === 'listicle' ? '#eff6ff' : '#ffffff',
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="radio"
                                        name="contentFormat"
                                        value="listicle"
                                        checked={contentFormat === 'listicle'}
                                        onChange={(e) => setContentFormat(e.target.value as 'comparison' | 'listicle' | 'guide')}
                                        style={{ marginRight: '12px' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                            📋 리스트형
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            항목별로 나열하는 글 (TOP 10, 5가지 방법 등)
                                        </div>
                                    </div>
                                </label>

                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: contentFormat === 'guide' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: contentFormat === 'guide' ? '#eff6ff' : '#ffffff',
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="radio"
                                        name="contentFormat"
                                        value="guide"
                                        checked={contentFormat === 'guide'}
                                        onChange={(e) => setContentFormat(e.target.value as 'comparison' | 'listicle' | 'guide')}
                                        style={{ marginRight: '12px' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                            🎯 가이드형 (권장)
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            단계별 설명하는 글 (완벽 가이드, 초보자 안내서)
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* 말투 선택 (네이버, 구글 공통) */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '12px'
                        }}>
                            💬 말투 선택
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: tone === 'friendly' ? '2px solid #10b981' : '2px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: tone === 'friendly' ? '#ecfdf5' : '#ffffff',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="tone"
                                    value="friendly"
                                    checked={tone === 'friendly'}
                                    onChange={(e) => setTone(e.target.value as 'friendly' | 'expert' | 'informative')}
                                    style={{ marginRight: '12px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        😊 친근한 말투
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        "~해요", "~예요" 반말체, 친구에게 말하듯이
                                    </div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: tone === 'informative' ? '2px solid #10b981' : '2px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: tone === 'informative' ? '#ecfdf5' : '#ffffff',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="tone"
                                    value="informative"
                                    checked={tone === 'informative'}
                                    onChange={(e) => setTone(e.target.value as 'friendly' | 'expert' | 'informative')}
                                    style={{ marginRight: '12px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        📖 정보성 말투 (권장)
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        "~합니다", "~입니다" 격식체, 뉴스 기사처럼 중립적이고 객관적
                                    </div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: tone === 'expert' ? '2px solid #10b981' : '2px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: tone === 'expert' ? '#ecfdf5' : '#ffffff',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="tone"
                                    value="expert"
                                    checked={tone === 'expert'}
                                    onChange={(e) => setTone(e.target.value as 'friendly' | 'expert' | 'informative')}
                                    style={{ marginRight: '12px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        🎓 전문가 말투
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        "~바랍니다", "~것입니다" 논문체, 데이터/연구 인용, 심층 분석
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* AI 모델 선택 (네이버, 구글 공통) */}
                    <div style={{ marginTop: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '12px'
                        }}>
                            🤖 AI 모델 선택
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: aiModel === 'gemini' ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: aiModel === 'gemini' ? '#f3e8ff' : '#ffffff',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="aiModel"
                                    value="gemini"
                                    checked={aiModel === 'gemini'}
                                    onChange={(e) => setAiModel(e.target.value as 'gemini' | 'claude' | 'chatgpt')}
                                    style={{ marginRight: '12px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        💎 Gemini 2.0 Flash
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        빠른 속도, 무료 할당량 제공
                                    </div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: aiModel === 'claude' ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: aiModel === 'claude' ? '#f3e8ff' : '#ffffff',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="aiModel"
                                    value="claude"
                                    checked={aiModel === 'claude'}
                                    onChange={(e) => setAiModel(e.target.value as 'gemini' | 'claude' | 'chatgpt')}
                                    style={{ marginRight: '12px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        🧠 Claude 3.5 Sonnet
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        높은 품질, 자연스러운 문체
                                    </div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: aiModel === 'chatgpt' ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: aiModel === 'chatgpt' ? '#f3e8ff' : '#ffffff',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="aiModel"
                                    value="chatgpt"
                                    checked={aiModel === 'chatgpt'}
                                    onChange={(e) => setAiModel(e.target.value as 'gemini' | 'claude' | 'chatgpt')}
                                    style={{ marginRight: '12px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                        ⚡ ChatGPT 4.0
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        안정적인 품질, 빠른 응답
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#374151',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            background: platform === 'naver' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}
                    >
                        글 작성 시작
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlogWritingModal;
