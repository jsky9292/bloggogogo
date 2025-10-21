import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    requiredTier: 'free' | 'basic' | 'pro' | 'enterprise';
    order: number;
    createdAt: Date;
}

interface Video {
    id: string;
    courseId: string;
    title: string;
    url: string;
    description: string;
    category: string;
    requiredTier: 'free' | 'basic' | 'pro' | 'enterprise';
    order: number;
    createdAt: Date;
}

const CoursePage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState<string>('free');
    const navigate = useNavigate();

    useEffect(() => {
        // 사용자 정보 가져오기
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setUserPlan(user.plan || 'free');
        }

        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const coursesCollection = collection(db, 'courses');
            const q = query(coursesCollection, orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            const courseList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Course[];

            setCourses(courseList);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const canAccessCourse = (requiredTier: string): boolean => {
        const tierLevels = { free: 0, basic: 1, pro: 2, enterprise: 3 };
        return tierLevels[userPlan as keyof typeof tierLevels] >= tierLevels[requiredTier as keyof typeof tierLevels];
    };

    const getTierBadge = (tier: string) => {
        const badges = {
            free: { text: '무료', bg: '#dcfce7', color: '#166534' },
            basic: { text: 'BASIC', bg: '#dbeafe', color: '#1e40af' },
            pro: { text: 'PRO', bg: '#fef3c7', color: '#92400e' },
            enterprise: { text: 'ENTERPRISE', bg: '#fce7f3', color: '#831843' }
        };
        const badge = badges[tier as keyof typeof badges] || badges.free;
        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                background: badge.bg,
                color: badge.color,
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600'
            }}>
                {badge.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                color: '#6b7280'
            }}>
                강의 목록을 불러오는 중...
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem'
        }}>
            {/* 페이지 헤더 */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                }}>
                    🎓 전체 강의
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                    마케팅, SEO, 블로그 운영 등 다양한 주제의 강의를 학습하세요
                </p>
            </div>

            {/* 코스 그리드 */}
            {courses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                        아직 등록된 강의가 없습니다.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {courses.map((course) => {
                        const hasAccess = canAccessCourse(course.requiredTier);

                        return (
                            <div
                                key={course.id}
                                onClick={() => hasAccess && navigate(`/course/${course.id}`)}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    cursor: hasAccess ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    opacity: hasAccess ? 1 : 0.6,
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    if (hasAccess) {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* 썸네일 */}
                                {course.thumbnail ? (
                                    <div style={{
                                        width: '100%',
                                        height: '180px',
                                        background: `url(${course.thumbnail}) center/cover`,
                                        position: 'relative'
                                    }}>
                                        {!hasAccess && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: 'rgba(0,0,0,0.7)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <div style={{
                                                    background: '#ffffff',
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    color: '#1f2937'
                                                }}>
                                                    🔒 {course.requiredTier.toUpperCase()} 필요
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '180px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: '3rem'
                                    }}>
                                        📚
                                    </div>
                                )}

                                {/* 코스 정보 */}
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <h3 style={{
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            color: '#1f2937',
                                            margin: 0
                                        }}>
                                            {course.title}
                                        </h3>
                                        {getTierBadge(course.requiredTier)}
                                    </div>

                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: '#6b7280',
                                        lineHeight: '1.5',
                                        margin: 0
                                    }}>
                                        {course.description || '강의 설명이 없습니다.'}
                                    </p>

                                    {hasAccess && (
                                        <div style={{
                                            marginTop: '1rem',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid #e5e7eb'
                                        }}>
                                            <button style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}>
                                                강의 시작하기 →
                                            </button>
                                        </div>
                                    )}

                                    {!hasAccess && (
                                        <div style={{
                                            marginTop: '1rem',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid #e5e7eb'
                                        }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/pricing');
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: '#f59e0b',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                플랜 업그레이드 →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CoursePage;
