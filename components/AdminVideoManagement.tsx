import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Video {
    id: string;
    title: string;
    url: string;
    description: string;
    category: 'tutorial' | 'feature' | 'tip' | 'promotion';
    order: number;
    createdAt: Date;
}

const AdminVideoManagement: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [newVideo, setNewVideo] = useState({
        title: '',
        url: '',
        description: '',
        category: 'tutorial' as 'tutorial' | 'feature' | 'tip' | 'promotion',
        order: 0
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const videosCollection = collection(db, 'videos');
            const snapshot = await getDocs(videosCollection);
            const videoList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as Video[];

            // Sort by order
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
        if (!newVideo.title || !newVideo.url) {
            alert('제목과 URL은 필수입니다.');
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
                title: '',
                url: '',
                description: '',
                category: 'tutorial',
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
        // YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        if (youtubeMatch) return youtubeMatch[1];

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return vimeoMatch[1];

        return null;
    };

    const getEmbedUrl = (url: string): string => {
        const videoId = extractVideoId(url);

        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Vimeo
        if (url.includes('vimeo.com')) {
            return `https://player.vimeo.com/video/${videoId}`;
        }

        // Naver TV or other direct video links
        return url;
    };

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                카테고리
                            </label>
                            <select
                                value={newVideo.category}
                                onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value as any })}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="tutorial">사용법</option>
                                <option value="feature">기능 설명</option>
                                <option value="tip">팁/노하우</option>
                                <option value="promotion">홍보</option>
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
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
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
                    등록된 영상 ({videos.length}개)
                </h3>

                {videos.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                        등록된 영상이 없습니다.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {videos.map((video) => (
                            <div key={video.id} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                gap: '1rem'
                            }}>
                                {/* Video Preview */}
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
                                            <h4 style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                marginBottom: '0.5rem',
                                                color: '#1f2937'
                                            }}>
                                                {video.title}
                                            </h4>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {video.description}
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: '#eff6ff',
                                                    color: '#2563eb',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {video.category === 'tutorial' ? '사용법' : video.category === 'feature' ? '기능설명' : video.category === 'tip' ? '팁/노하우' : '홍보'}
                                                </span>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: '#f3f4f6',
                                                    color: '#374151',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    순서: {video.order}
                                                </span>
                                            </div>
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
