import React, { useState } from 'react';

interface User {
    uid: string;
    email?: string;
    name?: string;
    plan: string;
}

interface EmailComposerProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
}

const EmailComposer: React.FC<EmailComposerProps> = ({ isOpen, onClose, users }) => {
    const [template, setTemplate] = useState<string>('custom');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipientType, setRecipientType] = useState<'all' | 'plan'>('all');
    const [selectedPlan, setSelectedPlan] = useState<string>('all');
    const [sending, setSending] = useState(false);

    // 템플릿 선택 시 자동으로 제목과 본문 채우기
    const templates = {
        update: {
            subject: '[Keyword Insight Pro] 새로운 기능 업데이트 안내',
            body: `안녕하세요, Keyword Insight Pro입니다.

고객님들께 유용한 새로운 기능을 소개합니다:

✨ 주요 업데이트 내용:
• [새 기능 1]: 상세 설명
• [새 기능 2]: 상세 설명
• [개선사항]: 상세 설명

더 나은 서비스로 보답하겠습니다.
감사합니다.

Keyword Insight Pro 팀 드림`
        },
        promotion: {
            subject: '[Keyword Insight Pro] 🎉 특별 할인 이벤트',
            body: `안녕하세요, Keyword Insight Pro입니다.

고객님들을 위한 특별한 혜택을 준비했습니다!

🎁 프로모션 내용:
• 프로 플랜 30% 할인
• 기간: [시작일] ~ [종료일]
• 혜택: [추가 혜택]

이 기회를 놓치지 마세요!

▶ 지금 바로 업그레이드하기
[링크]

Keyword Insight Pro 팀 드림`
        },
        tips: {
            subject: '[Keyword Insight Pro] 💡 키워드 분석 노하우',
            body: `안녕하세요, Keyword Insight Pro입니다.

효과적인 키워드 분석을 위한 팁을 공유합니다:

📌 이번 주 팁:
1. [팁 1]: 상세 설명
2. [팁 2]: 상세 설명
3. [팁 3]: 상세 설명

더 많은 정보는 블로그에서 확인하세요.

Keyword Insight Pro 팀 드림`
        },
        notice: {
            subject: '[Keyword Insight Pro] 📢 서비스 공지사항',
            body: `안녕하세요, Keyword Insight Pro입니다.

서비스 이용과 관련한 중요한 공지사항을 안내드립니다.

📢 공지 내용:
[공지 내용을 입력하세요]

이용에 불편을 드려 죄송합니다.

Keyword Insight Pro 팀 드림`
        }
    };

    const handleTemplateChange = (templateKey: string) => {
        setTemplate(templateKey);
        if (templateKey !== 'custom' && templates[templateKey as keyof typeof templates]) {
            const selectedTemplate = templates[templateKey as keyof typeof templates];
            setSubject(selectedTemplate.subject);
            setBody(selectedTemplate.body);
        } else if (templateKey === 'custom') {
            setSubject('');
            setBody('');
        }
    };

    const getRecipientCount = () => {
        if (recipientType === 'all') {
            return users.length;
        } else {
            if (selectedPlan === 'all') return users.length;
            return users.filter(u => u.plan === selectedPlan).length;
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            alert('제목과 본문을 입력해주세요.');
            return;
        }

        if (getRecipientCount() === 0) {
            alert('발송할 수신자가 없습니다.');
            return;
        }

        const confirmed = window.confirm(
            `${getRecipientCount()}명의 회원에게 이메일을 발송하시겠습니까?\n\n제목: ${subject}`
        );

        if (!confirmed) return;

        setSending(true);
        try {
            // TODO: 백엔드 API 호출
            const recipients = recipientType === 'all'
                ? users
                : users.filter(u => selectedPlan === 'all' || u.plan === selectedPlan);

            const response = await fetch('http://localhost:8082/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject,
                    body,
                    recipients: recipients.map(u => ({
                        email: u.email,
                        name: u.name
                    }))
                })
            });

            if (response.ok) {
                alert('이메일이 성공적으로 발송되었습니다!');
                onClose();
            } else {
                throw new Error('이메일 발송 실패');
            }
        } catch (error) {
            console.error('Email sending error:', error);
            alert('이메일 발송 중 오류가 발생했습니다.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e5e7eb',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        margin: 0
                    }}>
                        📧 회원 이메일 발송
                    </h2>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        margin: '8px 0 0 0'
                    }}>
                        뉴스레터, 공지사항, 프로모션 이메일을 작성하고 발송하세요
                    </p>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {/* 템플릿 선택 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                        }}>
                            템플릿 선택
                        </label>
                        <select
                            value={template}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="custom">직접 작성</option>
                            <option value="update">🔔 기능 업데이트</option>
                            <option value="promotion">🎉 프로모션/할인</option>
                            <option value="tips">💡 활용 팁</option>
                            <option value="notice">📢 공지사항</option>
                        </select>
                    </div>

                    {/* 수신자 선택 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                        }}>
                            수신자 선택
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            gap: '10px',
                            alignItems: 'center'
                        }}>
                            <select
                                value={recipientType}
                                onChange={(e) => setRecipientType(e.target.value as 'all' | 'plan')}
                                style={{
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="all">전체 회원</option>
                                <option value="plan">플랜별 선택</option>
                            </select>
                            {recipientType === 'plan' && (
                                <select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    style={{
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="all">모든 플랜</option>
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            )}
                        </div>
                        <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '8px'
                        }}>
                            발송 대상: <strong>{getRecipientCount()}명</strong>
                        </p>
                    </div>

                    {/* 제목 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                        }}>
                            이메일 제목
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="이메일 제목을 입력하세요"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    {/* 본문 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                        }}>
                            이메일 본문
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="이메일 내용을 입력하세요"
                            rows={12}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* 미리보기 */}
                    <div style={{
                        padding: '15px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}>
                        <h4 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '10px'
                        }}>
                            미리보기
                        </h4>
                        <div style={{
                            fontSize: '0.875rem',
                            color: '#6b7280'
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>제목:</strong> {subject || '(제목 없음)'}
                            </div>
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6'
                            }}>
                                {body || '(본문 없음)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    background: '#f9fafb'
                }}>
                    <button
                        onClick={onClose}
                        disabled={sending}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: sending ? 'not-allowed' : 'pointer',
                            opacity: sending ? 0.5 : 1
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        style={{
                            padding: '10px 20px',
                            background: sending
                                ? '#9ca3af'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: sending ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {sending ? '발송 중...' : '📧 이메일 발송'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposer;
