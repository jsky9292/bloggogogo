import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Video {
    id: string;
    title: string;
    url: string;
    description: string;
    category: 'tutorial' | 'feature' | 'tip' | 'promotion';
    order: number;
    createdAt: Date;
}

const VideoTutorials: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'tutorial' | 'feature' | 'tip' | 'promotion'>('all');

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
        } finally {
            setLoading(false);
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

    const filteredVideos = selectedCategory === 'all'
        ? videos
        : videos.filter(v => v.category === selectedCategory);

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'tutorial': return '사용법';
            case 'feature': return '기능 설명';
            case 'tip': return '팁/노하우';
            case 'promotion': return '홍보';
            default: return '전체';
        }
    };

    if (loading) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#6b7280'
            }}>
                영상을 불러오는 중...
            </div>
        );
    }

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <div style={{
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h2 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    color: '#1f2937'
                }}>
                    사용법 및 강의 영상
                </h2>
                <p style={{
                    fontSize: '1rem',
                    color: '#6b7280'
                }}>
                    Keyword Insight Pro의 다양한 기능을 영상으로 학습하세요
                </p>
            </div>

            {/* Category Filter */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
            }}>
                {['all', 'tutorial', 'feature', 'tip', 'promotion'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: selectedCategory === cat
                                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                : '#ffffff',
                            color: selectedCategory === cat ? '#ffffff' : '#374151',
                            border: selectedCategory === cat ? 'none' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        {getCategoryLabel(cat)}
                    </button>
                ))}
            </div>

            {/* Videos Grid */}
            {filteredVideos.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <p style={{
                        fontSize: '1rem',
                        color: '#6b7280'
                    }}>
                        등록된 영상이 없습니다.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredVideos.map((video) => (
                        <div key={video.id} style={{
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        >
                            {/* Video Player */}
                            <div style={{
                                position: 'relative',
                                paddingBottom: '56.25%', // 16:9 aspect ratio
                                height: 0,
                                overflow: 'hidden'
                            }}>
                                <iframe
                                    src={getEmbedUrl(video.url)}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            {/* Video Info */}
                            <div style={{ padding: '1rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem'
                                }}>
                                    <span style={{
                                        padding: '0.25rem 0.625rem',
                                        background: video.category === 'tutorial'
                                            ? '#dbeafe'
                                            : video.category === 'feature'
                                            ? '#d1fae5'
                                            : '#fef3c7',
                                        color: video.category === 'tutorial'
                                            ? '#1e40af'
                                            : video.category === 'feature'
                                            ? '#065f46'
                                            : '#92400e',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {getCategoryLabel(video.category)}
                                    </span>
                                </div>

                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#1f2937',
                                    lineHeight: '1.4'
                                }}>
                                    {video.title}
                                </h3>

                                {video.description && (
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: '#6b7280',
                                        lineHeight: '1.5',
                                        marginBottom: '0.75rem'
                                    }}>
                                        {video.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideoTutorials;
