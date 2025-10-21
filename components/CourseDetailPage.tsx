import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';

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

const CourseDetailPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState<string>('free');

    useEffect(() => {
        // 사용자 정보 가져오기
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setUserPlan(user.plan || 'free');
        }

        if (courseId) {
            fetchCourseData();
        }
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            // 코스 정보 가져오기
            const courseDoc = await getDoc(doc(db, 'courses', courseId!));
            if (courseDoc.exists()) {
                const courseData = {
                    id: courseDoc.id,
                    ...courseDoc.data(),
                    createdAt: courseDoc.data().createdAt?.toDate() || new Date()
                } as Course;
                setCourse(courseData);

                // 코스에 속한 영상 가져오기
                const videosCollection = collection(db, 'videos');
                const q = query(
                    videosCollection,
                    where('courseId', '==', courseId),
                    orderBy('order', 'asc')
                );
                const snapshot = await getDocs(q);
                const videoList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                })) as Video[];

                setVideos(videoList);

                // 첫 번째 영상 자동 선택
                if (videoList.length > 0) {
                    setSelectedVideo(videoList[0]);
                }
            } else {
                alert('코스를 찾을 수 없습니다.');
                navigate('/courses');
            }
        } catch (error) {
            console.error('Error fetching course data:', error);
            alert('코스 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const canAccessCourse = (requiredTier: string): boolean => {
        const tierLevels = { free: 0, basic: 1, pro: 2, enterprise: 3 };
        return tierLevels[userPlan as keyof typeof tierLevels] >= tierLevels[requiredTier as keyof typeof tierLevels];
    };

    const extractVideoId = (url: string): string | null => {
        const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        if (youtubeMatch) return youtubeMatch[1];

        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return vimeoMatch[1];

        return null;
    };

    const getEmbedUrl = (url: string): string => {
        const videoId = extractVideoId(url);

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        if (url.includes('vimeo.com')) {
            return `https://player.vimeo.com/video/${videoId}`;
        }

        return url;
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
                강의를 불러오는 중...
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                color: '#6b7280'
            }}>
                강의를 찾을 수 없습니다.
            </div>
        );
    }

    // 접근 권한 체크
    if (!canAccessCourse(course.requiredTier)) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '4rem auto',
                padding: '2rem',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
                    이 강의는 {course.requiredTier.toUpperCase()} 플랜이 필요합니다
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                    현재 플랜: {userPlan.toUpperCase()}
                </p>
                <button
                    onClick={() => navigate('/pricing')}
                    style={{
                        padding: '0.75rem 2rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    플랜 업그레이드 →
                </button>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '2rem'
        }}>
            {/* 뒤로가기 버튼 */}
            <button
                onClick={() => navigate('/courses')}
                style={{
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: '#374151'
                }}
            >
                ← 강의 목록으로
            </button>

            {/* 코스 제목 */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: 0
                    }}>
                        {course.title}
                    </h1>
                    {getTierBadge(course.requiredTier)}
                </div>
                <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                    {course.description}
                </p>
            </div>

            {/* LMS 레이아웃: 왼쪽 영상 플레이어 + 오른쪽 목차 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 380px',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {/* 왼쪽: 영상 플레이어 */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                }}>
                    {selectedVideo ? (
                        <>
                            {/* 영상 플레이어 */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                background: '#000000'
                            }}>
                                <iframe
                                    src={getEmbedUrl(selectedVideo.url)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            {/* 영상 정보 */}
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <h2 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        margin: 0
                                    }}>
                                        {selectedVideo.title}
                                    </h2>
                                    {getTierBadge(selectedVideo.requiredTier)}
                                </div>

                                {selectedVideo.category && (
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        background: '#eff6ff',
                                        color: '#1e40af',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        marginBottom: '0.75rem'
                                    }}>
                                        📱 {selectedVideo.category}
                                    </div>
                                )}

                                <p style={{
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    lineHeight: '1.6',
                                    margin: 0
                                }}>
                                    {selectedVideo.description || '영상 설명이 없습니다.'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            color: '#6b7280'
                        }}>
                            영상을 선택해주세요
                        </div>
                    )}
                </div>

                {/* 오른쪽: 강의 목차 */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* 목차 헤더 */}
                    <div style={{
                        padding: '1.25rem',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#f9fafb'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: 0
                        }}>
                            📚 강의 목차 ({videos.length}개)
                        </h3>
                    </div>

                    {/* 영상 리스트 */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto'
                    }}>
                        {videos.length === 0 ? (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}>
                                등록된 영상이 없습니다
                            </div>
                        ) : (
                            videos.map((video, index) => {
                                const hasAccess = canAccessCourse(video.requiredTier);
                                const isActive = selectedVideo?.id === video.id;

                                return (
                                    <div
                                        key={video.id}
                                        onClick={() => hasAccess && setSelectedVideo(video)}
                                        style={{
                                            padding: '1rem 1.25rem',
                                            borderBottom: '1px solid #e5e7eb',
                                            cursor: hasAccess ? 'pointer' : 'not-allowed',
                                            background: isActive ? '#eff6ff' : '#ffffff',
                                            opacity: hasAccess ? 1 : 0.6,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (hasAccess && !isActive) {
                                                e.currentTarget.style.background = '#f9fafb';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = '#ffffff';
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            {/* 순서 번호 */}
                                            <div style={{
                                                minWidth: '2rem',
                                                height: '2rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: isActive ? '#3b82f6' : '#f3f4f6',
                                                color: isActive ? '#ffffff' : '#6b7280',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600'
                                            }}>
                                                {index + 1}
                                            </div>

                                            {/* 영상 정보 */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: isActive ? '600' : '500',
                                                    color: isActive ? '#1e40af' : '#1f2937',
                                                    marginBottom: '0.25rem',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {video.title}
                                                    {!hasAccess && ' 🔒'}
                                                </div>

                                                {video.category && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280'
                                                    }}>
                                                        {video.category}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 재생 아이콘 */}
                                            {isActive && (
                                                <div style={{
                                                    fontSize: '1.25rem',
                                                    color: '#3b82f6'
                                                }}>
                                                    ▶
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;
