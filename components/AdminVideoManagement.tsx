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
    const [newVideo, setNewVideo] = useState({
        courseId: '',
        title: '',
        url: '',
        description: '',
        requiredTier: 'free' as 'free' | 'basic' | 'pro' | 'enterprise',
        order: 0
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');

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
                order: 0
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

    const filteredVideos = selectedCourse === 'all'
        ? videos
        : videos.filter(v => v.courseId === selectedCourse);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>;
    }

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '2rem',
                color: '#1f2937'
            }}>
                영상 관리
            </h2>

            {/* Course Filter */}
            <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
            }}>
                <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginRight: '0.75rem',
                    color: '#374151'
                }}>
                    코스 필터:
                </label>
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
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

            {/* Add New Video Form */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
            }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                }}>
                    새 영상 추가
                </h3>

                {courses.length === 0 && (
                    <div style={{
                        padding: '1rem',
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        marginBottom: '1rem'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                            ⚠️ 먼저 코스를 생성해주세요. 코스 관리 탭에서 추가할 수 있습니다.
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                            영상 URL * (YouTube, Vimeo, 네이버TV 등)
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

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
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

                        <div style={{ flex: 1 }}>
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

                    <button
                        onClick={handleAddVideo}
                        disabled={courses.length === 0}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: courses.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: courses.length === 0 ? 'not-allowed' : 'pointer',
                            alignSelf: 'flex-start'
                        }}
                    >
                        영상 추가
                    </button>
                </div>
            </div>

            {/* Video List */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem'
            }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    color: '#374151'
                }}>
                    등록된 영상 ({filteredVideos.length}개)
                </h3>

                {filteredVideos.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                        {selectedCourse === 'all' ? '등록된 영상이 없습니다.' : '선택한 코스에 영상이 없습니다.'}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredVideos.map((video) => (
                            <div key={video.id} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                gap: '1rem'
                            }}>
                                <div style={{ width: '300px', flexShrink: 0 }}>
                                    <iframe
                                        src={getEmbedUrl(video.url)}
                                        style={{
                                            width: '100%',
                                            height: '170px',
                                            border: 'none',
                                            borderRadius: '6px'
                                        }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>

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
                                                        cursor: 'pointer'
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
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                <h4 style={{
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    color: '#1f2937'
                                                }}>
                                                    {video.title}
                                                </h4>
                                                {getTierBadge(video.requiredTier)}
                                            </div>
                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: '#3b82f6',
                                                marginBottom: '0.5rem',
                                                fontWeight: '500'
                                            }}>
                                                📚 {getCourseTitle(video.courseId)}
                                            </p>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {video.description}
                                            </p>
                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: '#9ca3af'
                                            }}>
                                                순서: {video.order}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                <button
                                                    onClick={() => setEditingId(video.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#3b82f6',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    수정
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
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    삭제
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
