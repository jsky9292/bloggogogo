import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';

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
    requiredTier: 'free' | 'basic' | 'pro' | 'enterprise';
    order: number;
    duration?: string;
    createdAt: Date;
}

const AdminCourseWithVideos: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        thumbnail: '',
        requiredTier: 'basic' as const,
        order: 0
    });
    const [newVideo, setNewVideo] = useState({
        title: '',
        url: '',
        description: '',
        requiredTier: 'basic' as const,
        order: 0,
        duration: ''
    });

    useEffect(() => {
        fetchCourses();
        fetchVideos();
    }, []);

    const fetchCourses = async () => {
        try {
            const q = query(collection(db, 'courses'), orderBy('order', 'asc'));
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

    const fetchVideos = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'videos'));
            const videoList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Video[];
            setVideos(videoList);
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    };

    const handleAddCourse = async () => {
        if (!newCourse.title) {
            alert('코스 제목은 필수입니다.');
            return;
        }
        try {
            await addDoc(collection(db, 'courses'), {
                ...newCourse,
                createdAt: new Date()
            });
            alert('✅ 코스가 추가되었습니다!');
            setNewCourse({ title: '', description: '', thumbnail: '', requiredTier: 'basic', order: 0 });
            setShowAddCourse(false);
            fetchCourses();
        } catch (error) {
            console.error('Error adding course:', error);
            alert('추가에 실패했습니다.');
        }
    };

    const handleUpdateCourse = async () => {
        if (!editingCourse) return;
        try {
            await updateDoc(doc(db, 'courses', editingCourse.id), {
                title: editingCourse.title,
                description: editingCourse.description,
                thumbnail: editingCourse.thumbnail,
                requiredTier: editingCourse.requiredTier,
                order: editingCourse.order
            });
            alert('✅ 코스가 수정되었습니다!');
            setEditingCourse(null);
            fetchCourses();
        } catch (error) {
            console.error('Error updating course:', error);
            alert('수정에 실패했습니다.');
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        const courseVideos = videos.filter(v => v.courseId === courseId);
        if (courseVideos.length > 0) {
            alert(`이 코스에 ${courseVideos.length}개의 영상이 있습니다. 먼저 영상을 삭제해주세요.`);
            return;
        }
        if (!confirm('정말 이 코스를 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'courses', courseId));
            alert('삭제되었습니다.');
            setSelectedCourse(null);
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
        }
    };

    const handleAddVideo = async () => {
        if (!selectedCourse || !newVideo.title || !newVideo.url) {
            alert('제목과 URL은 필수입니다.');
            return;
        }
        try {
            await addDoc(collection(db, 'videos'), {
                ...newVideo,
                courseId: selectedCourse.id,
                createdAt: new Date()
            });
            alert('✅ 영상이 추가되었습니다!');
            setNewVideo({ title: '', url: '', description: '', requiredTier: 'basic', order: 0, duration: '' });
            fetchVideos();
        } catch (error) {
            console.error('Error adding video:', error);
            alert('추가에 실패했습니다.');
        }
    };

    const handleDeleteVideo = async (videoId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'videos', videoId));
            alert('삭제되었습니다.');
            fetchVideos();
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    const getTierBadge = (tier: string) => {
        const badges: Record<string, { label: string; color: string; bg: string }> = {
            free: { label: '무료', color: '#059669', bg: '#d1fae5' },
            basic: { label: 'BASIC', color: '#2563eb', bg: '#dbeafe' },
            pro: { label: 'PRO', color: '#d97706', bg: '#fef3c7' },
            enterprise: { label: 'ENTERPRISE', color: '#7c3aed', bg: '#ede9fe' }
        };
        const badge = badges[tier] || badges.free;
        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                background: badge.bg,
                color: badge.color,
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: '700'
            }}>
                {badge.label}
            </span>
        );
    };

    const getEmbedUrl = (url: string): string => {
        const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return url;
    };

    const courseVideos = selectedCourse ? videos.filter(v => v.courseId === selectedCourse.id).sort((a, b) => a.order - b.order) : [];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
                로딩 중...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100%', background: '#f3f4f6' }}>
            {/* 왼쪽: 코스 목록 */}
            <div style={{
                width: '320px',
                background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
                borderRight: '1px solid #4338ca',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                {/* 헤더 */}
                <div style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        marginBottom: '0.75rem'
                    }}>
                        📚 코스 목록
                    </h3>
                    <button
                        onClick={() => setShowAddCourse(!showAddCourse)}
                        style={{
                            width: '100%',
                            padding: '0.625rem',
                            background: showAddCourse ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                            color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}
                    >
                        {showAddCourse ? '✕ 취소' : '➕ 새 코스 추가'}
                    </button>
                </div>

                {/* 새 코스 추가 폼 */}
                {showAddCourse && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <input
                            type="text"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                            placeholder="코스 제목"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                fontSize: '0.875rem'
                            }}
                        />
                        <textarea
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            placeholder="코스 설명"
                            rows={2}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                fontSize: '0.875rem',
                                resize: 'none'
                            }}
                        />
                        <select
                            value={newCourse.requiredTier}
                            onChange={(e) => setNewCourse({ ...newCourse, requiredTier: e.target.value as any })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="free" style={{ color: '#000' }}>무료</option>
                            <option value="basic" style={{ color: '#000' }}>Basic</option>
                            <option value="pro" style={{ color: '#000' }}>Pro</option>
                            <option value="enterprise" style={{ color: '#000' }}>Enterprise</option>
                        </select>
                        <button
                            onClick={handleAddCourse}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}
                        >
                            ✅ 코스 추가
                        </button>
                    </div>
                )}

                {/* 코스 리스트 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    {courses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
                            <p>등록된 코스가 없습니다</p>
                        </div>
                    ) : (
                        courses.map(course => {
                            const videoCount = videos.filter(v => v.courseId === course.id).length;
                            const isSelected = selectedCourse?.id === course.id;
                            return (
                                <div
                                    key={course.id}
                                    onClick={() => setSelectedCourse(course)}
                                    style={{
                                        padding: '1rem',
                                        marginBottom: '0.5rem',
                                        background: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.05)',
                                        border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>
                                            {course.title}
                                        </h4>
                                        {getTierBadge(course.requiredTier)}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.375rem' }}>
                                        {course.description || '설명 없음'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>
                                            🎬 {videoCount}개 영상
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCourse(course);
                                                }}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'rgba(59, 130, 246, 0.3)',
                                                    color: '#93c5fd',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCourse(course.id);
                                                }}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'rgba(239, 68, 68, 0.3)',
                                                    color: '#fca5a5',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 오른쪽: 선택된 코스의 영상 관리 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selectedCourse ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#6b7280'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👈</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            코스를 선택하세요
                        </h3>
                        <p>왼쪽 목록에서 코스를 클릭하면 영상을 관리할 수 있습니다.</p>
                    </div>
                ) : (
                    <>
                        {/* 선택된 코스 헤더 */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                            color: '#ffffff'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                                        {selectedCourse.title}
                                    </h2>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                        {selectedCourse.description || '설명 없음'}
                                    </p>
                                </div>
                                {getTierBadge(selectedCourse.requiredTier)}
                            </div>
                        </div>

                        {/* 영상 목록 + 추가 폼 */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            {/* 영상 추가 폼 */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                marginBottom: '1.5rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                                    ➕ 새 영상 추가
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={newVideo.title}
                                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                                        placeholder="영상 제목 *"
                                        style={{
                                            padding: '0.625rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={newVideo.url}
                                        onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                                        placeholder="YouTube/Vimeo URL *"
                                        style={{
                                            padding: '0.625rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={newVideo.duration}
                                        onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                                        placeholder="시간"
                                        style={{
                                            padding: '0.625rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={newVideo.description}
                                        onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                                        placeholder="설명 (선택)"
                                        style={{
                                            flex: 1,
                                            padding: '0.625rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                    <input
                                        type="number"
                                        value={newVideo.order}
                                        onChange={(e) => setNewVideo({ ...newVideo, order: parseInt(e.target.value) || 0 })}
                                        placeholder="순서"
                                        style={{
                                            width: '70px',
                                            padding: '0.625rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                    <button
                                        onClick={handleAddVideo}
                                        style={{
                                            padding: '0.625rem 1.25rem',
                                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        🚀 추가
                                    </button>
                                </div>
                            </div>

                            {/* 영상 목록 */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid #e5e7eb'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                                    🎬 등록된 영상 ({courseVideos.length}개)
                                </h3>

                                {courseVideos.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        <p>이 코스에 등록된 영상이 없습니다.</p>
                                        <p style={{ fontSize: '0.875rem' }}>위 폼에서 영상을 추가하세요!</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {courseVideos.map((video, index) => (
                                            <div key={video.id} style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                padding: '0.875rem',
                                                background: '#f9fafb',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px'
                                            }}>
                                                {/* 썸네일 */}
                                                <div style={{
                                                    width: '160px',
                                                    height: '90px',
                                                    flexShrink: 0,
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    background: '#000'
                                                }}>
                                                    <iframe
                                                        src={getEmbedUrl(video.url)}
                                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                                    />
                                                </div>
                                                {/* 정보 */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                                        <span style={{
                                                            background: '#e5e7eb',
                                                            padding: '0.125rem 0.375rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: '600',
                                                            color: '#6b7280'
                                                        }}>
                                                            #{index + 1}
                                                        </span>
                                                        {video.duration && (
                                                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                ⏱️ {video.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                                                        {video.title}
                                                    </h4>
                                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                        {video.description || '설명 없음'}
                                                    </p>
                                                </div>
                                                {/* 삭제 버튼 */}
                                                <button
                                                    onClick={() => handleDeleteVideo(video.id)}
                                                    style={{
                                                        padding: '0.375rem 0.625rem',
                                                        background: '#fee2e2',
                                                        color: '#dc2626',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        alignSelf: 'center'
                                                    }}
                                                >
                                                    🗑️ 삭제
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* 수정 모달 */}
            {editingCourse && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>
                            ✏️ 코스 수정
                        </h3>
                        <input
                            type="text"
                            value={editingCourse.title}
                            onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                            placeholder="코스 제목"
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                marginBottom: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        />
                        <textarea
                            value={editingCourse.description}
                            onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                            placeholder="코스 설명"
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                marginBottom: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                resize: 'none'
                            }}
                        />
                        <select
                            value={editingCourse.requiredTier}
                            onChange={(e) => setEditingCourse({ ...editingCourse, requiredTier: e.target.value as any })}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                marginBottom: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="free">무료</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                        <input
                            type="number"
                            value={editingCourse.order}
                            onChange={(e) => setEditingCourse({ ...editingCourse, order: parseInt(e.target.value) || 0 })}
                            placeholder="순서"
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                marginBottom: '1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditingCourse(null)}
                                style={{
                                    padding: '0.625rem 1rem',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUpdateCourse}
                                style={{
                                    padding: '0.625rem 1rem',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseWithVideos;
