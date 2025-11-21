import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

interface TutorialVideo {
    id: string;
    title: string;
    url: string;
    description: string;
    category: 'tutorial' | 'feature' | 'tip' | 'promotion';
    order: number;
    duration?: string;
    createdAt: Date;
}

const AdminTutorialManagement: React.FC = () => {
    const [videos, setVideos] = useState<TutorialVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingVideo, setEditingVideo] = useState<TutorialVideo | null>(null);
    const [newVideo, setNewVideo] = useState({
        title: '',
        url: '',
        description: '',
        category: 'tutorial' as 'tutorial' | 'feature' | 'tip' | 'promotion',
        order: 0,
        duration: ''
    });

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const videosCollection = collection(db, 'tutorial_videos');
            const q = query(videosCollection, orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            const videoList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as TutorialVideo[];
            setVideos(videoList);
        } catch (error) {
            console.error('Error fetching tutorial videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVideo = async () => {
        if (!newVideo.title || !newVideo.url) {
            alert('제목과 URL은 필수입니다.');
            return;
        }

        try {
            await addDoc(collection(db, 'tutorial_videos'), {
                ...newVideo,
                createdAt: new Date()
            });
            alert('✅ 사용법 강의가 추가되었습니다!');
            setNewVideo({
                title: '',
                url: '',
                description: '',
                category: 'tutorial',
                order: 0,
                duration: ''
            });
            fetchVideos();
        } catch (error) {
            console.error('Error adding video:', error);
            alert('추가에 실패했습니다.');
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'tutorial_videos', id));
            alert('삭제되었습니다.');
            fetchVideos();
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    const handleUpdateVideo = async (id: string, updates: Partial<TutorialVideo>) => {
        try {
            await updateDoc(doc(db, 'tutorial_videos', id), updates);
            alert('수정되었습니다.');
            setEditingId(null);
            fetchVideos();
        } catch (error) {
            console.error('Error updating video:', error);
        }
    };

    const getCategoryInfo = (category: string) => {
        const info = {
            tutorial: { label: '🎓 사용법', color: '#3b82f6', bg: '#dbeafe' },
            feature: { label: '⚡ 기능설명', color: '#8b5cf6', bg: '#ede9fe' },
            tip: { label: '💡 팁/노하우', color: '#f59e0b', bg: '#fef3c7' },
            promotion: { label: '📢 홍보', color: '#ec4899', bg: '#fce7f3' }
        };
        return info[category as keyof typeof info] || info.tutorial;
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

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#6b7280'
            }}>
                로딩 중...
            </div>
        );
    }

    return (
        <div style={{
            height: '100%',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%)'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                padding: '2rem',
                color: '#ffffff'
            }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    🎓 사용법 강의 관리
                </h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    KeyWinSight 사용법 영상을 등록하고 관리합니다. 메인화면 "사용법 강의" 탭에 표시됩니다.
                </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
                {/* 새 영상 추가 폼 */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1.25rem',
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            background: '#dcfce7',
                            borderRadius: '8px',
                            padding: '0.375rem',
                            display: 'flex'
                        }}>➕</span>
                        새 사용법 강의 추가
                    </h3>

                    {/* 카테고리 선택 */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            카테고리
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {['tutorial', 'feature', 'tip', 'promotion'].map(cat => {
                                const info = getCategoryInfo(cat);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setNewVideo({ ...newVideo, category: cat as any })}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: newVideo.category === cat ? info.color : '#f3f4f6',
                                            color: newVideo.category === cat ? '#ffffff' : '#374151',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {info.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: '#374151'
                            }}>
                                영상 제목 *
                            </label>
                            <input
                                type="text"
                                value={newVideo.title}
                                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                                placeholder="예: 키워드 검색 방법"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: '#374151'
                            }}>
                                재생시간
                            </label>
                            <input
                                type="text"
                                value={newVideo.duration}
                                onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                                placeholder="예: 5:30"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
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
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            설명
                        </label>
                        <textarea
                            value={newVideo.description}
                            onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                            placeholder="영상에 대한 간단한 설명"
                            rows={2}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '100px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: '#374151'
                            }}>
                                순서
                            </label>
                            <input
                                type="number"
                                value={newVideo.order}
                                onChange={(e) => setNewVideo({ ...newVideo, order: parseInt(e.target.value) || 0 })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleAddVideo}
                            style={{
                                marginTop: '1.5rem',
                                padding: '0.75rem 2rem',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            🚀 추가하기
                        </button>
                    </div>
                </div>

                {/* 영상 목록 */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        color: '#1f2937'
                    }}>
                        등록된 사용법 강의 ({videos.length}개)
                    </h3>

                    {videos.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
                            <p>등록된 사용법 강의가 없습니다.</p>
                            <p style={{ fontSize: '0.875rem' }}>위 폼에서 새 영상을 추가해보세요!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {videos.map((video) => {
                                const catInfo = getCategoryInfo(video.category);
                                return (
                                    <div key={video.id} style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        padding: '1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        background: '#fafafa'
                                    }}>
                                        {/* 썸네일 */}
                                        <div style={{
                                            width: '200px',
                                            height: '112px',
                                            flexShrink: 0,
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <iframe
                                                src={getEmbedUrl(video.url)}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none'
                                                }}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        </div>

                                        {/* 정보 */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: catInfo.bg,
                                                    color: catInfo.color,
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {catInfo.label}
                                                </span>
                                                {video.duration && (
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        ⏱️ {video.duration}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                    순서: {video.order}
                                                </span>
                                            </div>
                                            <h4 style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: '#1f2937',
                                                marginBottom: '0.25rem'
                                            }}>
                                                {video.title}
                                            </h4>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginBottom: '0.75rem'
                                            }}>
                                                {video.description || '설명 없음'}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setEditingVideo(video)}
                                                    style={{
                                                        padding: '0.375rem 0.75rem',
                                                        background: '#3b82f6',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ✏️ 수정
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVideo(video.id)}
                                                    style={{
                                                        padding: '0.375rem 0.75rem',
                                                        background: '#ef4444',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    🗑️ 삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 수정 모달 */}
            {editingVideo && (
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
                        borderRadius: '16px',
                        padding: '1.5rem',
                        width: '500px',
                        maxWidth: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', color: '#1f2937' }}>
                            ✏️ 사용법 강의 수정
                        </h3>

                        {/* 카테고리 */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                카테고리
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['tutorial', 'feature', 'tip', 'promotion'].map(cat => {
                                    const info = getCategoryInfo(cat);
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setEditingVideo({ ...editingVideo, category: cat as any })}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: editingVideo.category === cat ? info.color : '#f3f4f6',
                                                color: editingVideo.category === cat ? '#ffffff' : '#374151',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {info.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                영상 제목
                            </label>
                            <input
                                type="text"
                                value={editingVideo.title}
                                onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                영상 URL
                            </label>
                            <input
                                type="text"
                                value={editingVideo.url}
                                onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                설명
                            </label>
                            <textarea
                                value={editingVideo.description}
                                onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                    재생시간
                                </label>
                                <input
                                    type="text"
                                    value={editingVideo.duration || ''}
                                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                                    placeholder="예: 5:30"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                    순서
                                </label>
                                <input
                                    type="number"
                                    value={editingVideo.order}
                                    onChange={(e) => setEditingVideo({ ...editingVideo, order: parseInt(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditingVideo(null)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await updateDoc(doc(db, 'tutorial_videos', editingVideo.id), {
                                            title: editingVideo.title,
                                            url: editingVideo.url,
                                            description: editingVideo.description,
                                            category: editingVideo.category,
                                            duration: editingVideo.duration,
                                            order: editingVideo.order
                                        });
                                        alert('✅ 수정되었습니다!');
                                        setEditingVideo(null);
                                        fetchVideos();
                                    } catch (error) {
                                        console.error('Error updating:', error);
                                        alert('수정에 실패했습니다.');
                                    }
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
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

export default AdminTutorialManagement;
