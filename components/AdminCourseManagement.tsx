import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

interface Course {
    id: string;
    title: string;        // "마케팅 강의", "SEO 최적화" 등 (주제별 대분류)
    description: string;
    thumbnail: string;
    requiredTier: 'free' | 'basic' | 'pro' | 'enterprise';
    order: number;
    createdAt: Date;
}

const AdminCourseManagement: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        thumbnail: '',
        requiredTier: 'free' as 'free' | 'basic' | 'pro' | 'enterprise',
        order: 0
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
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
            alert('코스 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async () => {
        if (!newCourse.title) {
            alert('제목은 필수입니다.');
            return;
        }

        try {
            const coursesCollection = collection(db, 'courses');
            await addDoc(coursesCollection, {
                ...newCourse,
                createdAt: new Date()
            });

            alert('코스가 추가되었습니다.');
            setNewCourse({
                title: '',
                description: '',
                thumbnail: '',
                requiredTier: 'free',
                order: 0
            });
            fetchCourses();
        } catch (error) {
            console.error('Error adding course:', error);
            alert('코스 추가에 실패했습니다.');
        }
    };

    const handleUpdateCourse = async (id: string, updates: Partial<Course>) => {
        try {
            const courseDoc = doc(db, 'courses', id);
            await updateDoc(courseDoc, updates);
            alert('코스가 수정되었습니다.');
            fetchCourses();
            setEditingId(null);
        } catch (error) {
            console.error('Error updating course:', error);
            alert('코스 수정에 실패했습니다.');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('정말 이 코스를 삭제하시겠습니까? 관련 영상도 함께 고려해주세요.')) return;

        try {
            const courseDoc = doc(db, 'courses', id);
            await deleteDoc(courseDoc);
            alert('코스가 삭제되었습니다.');
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('코스 삭제에 실패했습니다.');
        }
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
                코스 관리 (주제별 대분류)
            </h2>

            <div style={{
                background: '#eff6ff',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
            }}>
                <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                    💡 <strong>코스 구조:</strong> 여기서 만든 코스(예: "마케팅 강의")에 영상을 추가할 때 플랫폼(블로그/인스타/유튜브) 카테고리를 선택할 수 있습니다.
                </p>
            </div>

            {/* Add New Course Form */}
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
                    새 코스 추가
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
                            코스 제목 * (주제별 대분류)
                        </label>
                        <input
                            type="text"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                            placeholder="예: 마케팅 강의, SEO 최적화, 콘텐츠 제작 등"
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
                            코스 설명
                        </label>
                        <textarea
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            placeholder="코스에 대한 설명을 입력하세요"
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

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            color: '#374151'
                        }}>
                            썸네일 URL (선택)
                        </label>
                        <input
                            type="text"
                            value={newCourse.thumbnail}
                            onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
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
                                value={newCourse.requiredTier}
                                onChange={(e) => setNewCourse({ ...newCourse, requiredTier: e.target.value as any })}
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
                                value={newCourse.order}
                                onChange={(e) => setNewCourse({ ...newCourse, order: parseInt(e.target.value) || 0 })}
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
                        onClick={handleAddCourse}
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
                        코스 추가
                    </button>
                </div>
            </div>

            {/* Course List */}
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
                    등록된 코스 ({courses.length}개)
                </h3>

                {courses.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                        등록된 코스가 없습니다.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {courses.map((course) => (
                            <div key={course.id} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                display: 'flex',
                                gap: '1.5rem'
                            }}>
                                {/* Thumbnail */}
                                {course.thumbnail && (
                                    <div style={{ width: '150px', height: '100px', flexShrink: 0 }}>
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Course Info */}
                                <div style={{ flex: 1 }}>
                                    {editingId === course.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                defaultValue={course.title}
                                                id={`title-${course.id}`}
                                                placeholder="코스 제목"
                                                style={{
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                            <textarea
                                                defaultValue={course.description}
                                                id={`desc-${course.id}`}
                                                rows={2}
                                                placeholder="코스 설명"
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
                                                        const title = (document.getElementById(`title-${course.id}`) as HTMLInputElement).value;
                                                        const description = (document.getElementById(`desc-${course.id}`) as HTMLTextAreaElement).value;
                                                        handleUpdateCourse(course.id, { title, description });
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <h4 style={{
                                                    fontSize: '1.125rem',
                                                    fontWeight: '600',
                                                    color: '#1f2937'
                                                }}>
                                                    {course.title}
                                                </h4>
                                                {getTierBadge(course.requiredTier)}
                                            </div>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {course.description}
                                            </p>
                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: '#9ca3af'
                                            }}>
                                                순서: {course.order}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                <button
                                                    onClick={() => setEditingId(course.id)}
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
                                                    onClick={() => handleDeleteCourse(course.id)}
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

export default AdminCourseManagement;
