import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';

interface Video {
    id: string;
    courseId: string;
    title: string;
    url: string;
    description: string;
    requiredTier: 'free' | 'basic' | 'pro' | 'enterprise';
    order: number;
    duration?: string; // 재생시간
    views?: number; // 조회수
    createdAt: Date;
}

interface Course {
    id: string;
    title: string;
}

const AdminVideoManagement: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
    const [newVideo, setNewVideo] = useState({
        courseId: '',
        title: '',
        url: '',
        description: '',
        requiredTier: 'free' as 'free' | 'basic' | 'pro' | 'enterprise',
        order: 0,
        duration: '',
        views: 0
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    useEffect(() => {
        fetchCourses();
        fetchVideos();
    }, []);

    const fetchCourses = async () => {
        try {
            const coursesCollection = collection(db, 'courses');
            const snapshot = await getDocs(coursesCollection);
            const courseList = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title
            })) as Course[];
            setCourses(courseList);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchVideos = async () => {
        try {
            const videosCollection = collection(db, 'videos');
            const snapshot = await getDocs(videosCollection);
            const videoList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Video[];

            videoList.sort((a, b) => a.order - b.order);
            setVideos(videoList);
        } catch (error) {
            console.error('Error fetching videos:', error);
            alert('영상 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddVideo = async () => {
        if (!newVideo.title || !newVideo.url || !newVideo.courseId) {
            alert('제목, URL, 코스는 필수입니다.');
            return;
        }

        try {
            const videosCollection = collection(db, 'videos');
            await addDoc(videosCollection, {
                ...newVideo,
                createdAt: new Date()
            });

            alert('영상이 추가되었습니다.');
            setNewVideo({
                courseId: '',
                title: '',
                url: '',
                description: '',
                requiredTier: 'free',
                order: 0,
                duration: '',
                views: 0
            });
            fetchVideos();
        } catch (error) {
            console.error('Error adding video:', error);
            alert('영상 추가에 실패했습니다.');
        }
    };

    const handleUpdateVideo = async (id: string, updates: Partial<Video>) => {
        try {
            const videoDoc = doc(db, 'videos', id);
            await updateDoc(videoDoc, updates);
            alert('영상이 수정되었습니다.');
            fetchVideos();
            setEditingId(null);
        } catch (error) {
            console.error('Error updating video:', error);
            alert('영상 수정에 실패했습니다.');
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm('정말 이 영상을 삭제하시겠습니까?')) return;

        try {
            const videoDoc = doc(db, 'videos', id);
            await deleteDoc(videoDoc);
            alert('영상이 삭제되었습니다.');
            fetchVideos();
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('영상 삭제에 실패했습니다.');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedVideos.size === 0) {
            alert('삭제할 영상을 선택해주세요.');
            return;
        }

        if (!confirm(`선택한 ${selectedVideos.size}개의 영상을 삭제하시겠습니까?`)) return;

        try {
            const promises = Array.from(selectedVideos).map(id =>
                deleteDoc(doc(db, 'videos', id))
            );
            await Promise.all(promises);
            alert('선택한 영상들이 삭제되었습니다.');
            setSelectedVideos(new Set());
            fetchVideos();
        } catch (error) {
            console.error('Error bulk deleting videos:', error);
            alert('일괄 삭제 중 오류가 발생했습니다.');
        }
    };

    const toggleVideoSelection = (id: string) => {
        const newSelected = new Set(selectedVideos);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedVideos(newSelected);
    };

    const selectAllVideos = () => {
        if (selectedVideos.size === filteredVideos.length) {
            setSelectedVideos(new Set());
        } else {
            setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
        }
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

    const getCourseTitle = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : '알 수 없음';
    };

    const filteredVideos = videos
        .filter(v => selectedCourse === 'all' || v.courseId === selectedCourse)
        .filter(v => selectedTierFilter === 'all' || v.requiredTier === selectedTierFilter)
        .filter(v =>
            searchTerm === '' ||
            v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // 통계 계산
    const stats = {
        total: videos.length,
        byTier: {
            free: videos.filter(v => v.requiredTier === 'free').length,
            basic: videos.filter(v => v.requiredTier === 'basic').length,
            pro: videos.filter(v => v.requiredTier === 'pro').length,
            enterprise: videos.filter(v => v.requiredTier === 'enterprise').length
        },
        byCourse: courses.map(c => ({
            title: c.title,
            count: videos.filter(v => v.courseId === c.id).length
        }))
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>;
    }

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1400px',
            margin: '0 auto',
            background: '#f9fafb',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    color: '#111827'
                }}>
                    📹 영상 관리
                </h2>
                <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                }}>
                    동영상 강의 등록 및 관리
                </p>
            </div>

            {/* Statistics Dashboard */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        총 영상 수
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                        {stats.total}
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        무료 영상
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                        {stats.byTier.free}
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        유료 영상
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                        {stats.byTier.basic + stats.byTier.pro + stats.byTier.enterprise}
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        코스 수
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                        {courses.length}
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    {/* Search */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            🔍 검색
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="제목 또는 설명으로 검색..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    {/* Course Filter */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            📚 코스 필터
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">전체 코스</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tier Filter */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            🎯 등급 필터
                        </label>
                        <select
                            value={selectedTierFilter}
                            onChange={(e) => setSelectedTierFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">모든 등급</option>
                            <option value="free">무료</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    {/* View Mode */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            📊 표시 방식
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem 1rem',
                                    background: viewMode === 'list' ? '#3b82f6' : '#ffffff',
                                    color: viewMode === 'list' ? '#ffffff' : '#6b7280',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                목록
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem 1rem',
                                    background: viewMode === 'grid' ? '#3b82f6' : '#ffffff',
                                    color: viewMode === 'grid' ? '#ffffff' : '#6b7280',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                그리드
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedVideos.size > 0 && (
                    <div style={{
                        background: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e' }}>
                            {selectedVideos.size}개 선택됨
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setSelectedVideos(new Set())}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#ffffff',
                                    color: '#6b7280',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                선택 해제
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                일괄 삭제
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add New Video Form */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span>➕</span> 새 영상 추가
                </h3>

                {courses.length === 0 && (
                    <div style={{
                        padding: '1rem',
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                            ⚠️ 먼저 코스를 생성해주세요. 코스 관리 탭에서 추가할 수 있습니다.
                        </p>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            소속 코스 *
                        </label>
                        <select
                            value={newVideo.courseId}
                            onChange={(e) => setNewVideo({ ...newVideo, courseId: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="">코스를 선택하세요</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={newVideo.title}
                            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                            placeholder="영상 제목을 입력하세요"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            영상 URL * (YouTube, Vimeo)
                        </label>
                        <input
                            type="text"
                            value={newVideo.url}
                            onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            재생시간 (예: 10:25)
                        </label>
                        <input
                            type="text"
                            value={newVideo.duration}
                            onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                            placeholder="10:25"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            필요 등급
                        </label>
                        <select
                            value={newVideo.requiredTier}
                            onChange={(e) => setNewVideo({ ...newVideo, requiredTier: e.target.value as any })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="free">무료 (Free)</option>
                            <option value="basic">베이직 (Basic)</option>
                            <option value="pro">프로 (Pro)</option>
                            <option value="enterprise">엔터프라이즈 (Enterprise)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            순서 (낮을수록 먼저)
                        </label>
                        <input
                            type="number"
                            value={newVideo.order}
                            onChange={(e) => setNewVideo({ ...newVideo, order: parseInt(e.target.value) || 0 })}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                        color: '#374151'
                    }}>
                        설명
                    </label>
                    <textarea
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                        placeholder="영상 설명을 입력하세요"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <button
                    onClick={handleAddVideo}
                    disabled={courses.length === 0}
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: courses.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: courses.length === 0 ? 'not-allowed' : 'pointer',
                        boxShadow: courses.length === 0 ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    영상 추가
                </button>
            </div>

            {/* Video List */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#111827'
                    }}>
                        등록된 영상 ({filteredVideos.length}개)
                    </h3>
                    {filteredVideos.length > 0 && (
                        <button
                            onClick={selectAllVideos}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#ffffff',
                                color: '#3b82f6',
                                border: '1px solid #3b82f6',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            {selectedVideos.size === filteredVideos.length ? '전체 해제' : '전체 선택'}
                        </button>
                    )}
                </div>

                {filteredVideos.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: '#6b7280'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
                        <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                            {searchTerm || selectedCourse !== 'all' || selectedTierFilter !== 'all'
                                ? '조건에 맞는 영상이 없습니다.'
                                : '등록된 영상이 없습니다.'}
                        </p>
                        <p style={{ fontSize: '0.875rem' }}>
                            새 영상을 추가해보세요.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: viewMode === 'grid' ? 'grid' : 'flex',
                        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : undefined,
                        flexDirection: viewMode === 'list' ? 'column' : undefined,
                        gap: '1rem'
                    }}>
                        {filteredVideos.map((video) => (
                            <div key={video.id} style={{
                                border: selectedVideos.has(video.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '1rem',
                                background: selectedVideos.has(video.id) ? '#eff6ff' : '#ffffff',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: viewMode === 'grid' ? 'column' : 'row',
                                gap: '1rem'
                            }}>
                                {/* Checkbox */}
                                <div style={{
                                    position: viewMode === 'grid' ? 'absolute' : 'relative',
                                    top: viewMode === 'grid' ? '1rem' : 'auto',
                                    left: viewMode === 'grid' ? '1rem' : 'auto',
                                    zIndex: 1
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedVideos.has(video.id)}
                                        onChange={() => toggleVideoSelection(video.id)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>

                                {/* Video Thumbnail */}
                                <div style={{
                                    width: viewMode === 'grid' ? '100%' : '400px',
                                    flexShrink: 0
                                }}>
                                    <iframe
                                        src={getEmbedUrl(video.url)}
                                        style={{
                                            width: '100%',
                                            height: viewMode === 'grid' ? '200px' : '225px',
                                            border: 'none',
                                            borderRadius: '8px'
                                        }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>

                                {/* Video Info */}
                                <div style={{ flex: 1 }}>
                                    {editingId === video.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                defaultValue={video.title}
                                                id={`title-${video.id}`}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <input
                                                type="text"
                                                defaultValue={video.url}
                                                id={`url-${video.id}`}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <textarea
                                                defaultValue={video.description}
                                                id={`desc-${video.id}`}
                                                rows={2}
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => {
                                                        const title = (document.getElementById(`title-${video.id}`) as HTMLInputElement).value;
                                                        const url = (document.getElementById(`url-${video.id}`) as HTMLInputElement).value;
                                                        const description = (document.getElementById(`desc-${video.id}`) as HTMLTextAreaElement).value;
                                                        handleUpdateVideo(video.id, { title, url, description });
                                                    }}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#10b981',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#6b7280',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.5rem',
                                                marginBottom: '0.5rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <h4 style={{
                                                    fontSize: '1.125rem',
                                                    fontWeight: '600',
                                                    color: '#111827',
                                                    flex: 1
                                                }}>
                                                    {video.title}
                                                </h4>
                                                {getTierBadge(video.requiredTier)}
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                marginBottom: '0.75rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <p style={{
                                                    fontSize: '0.875rem',
                                                    color: '#3b82f6',
                                                    fontWeight: '500'
                                                }}>
                                                    📚 {getCourseTitle(video.courseId)}
                                                </p>
                                                {video.duration && (
                                                    <p style={{
                                                        fontSize: '0.875rem',
                                                        color: '#6b7280',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        ⏱️ {video.duration}
                                                    </p>
                                                )}
                                                <p style={{
                                                    fontSize: '0.875rem',
                                                    color: '#6b7280'
                                                }}>
                                                    순서: {video.order}
                                                </p>
                                            </div>

                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginBottom: '1rem',
                                                lineHeight: '1.5'
                                            }}>
                                                {video.description || '설명 없음'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setEditingId(video.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#3b82f6',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    ✏️ 수정
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVideo(video.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#ef4444',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    🗑️ 삭제
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVideoManagement;
