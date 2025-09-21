import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

interface User {
    uid: string;
    email?: string;
    displayName?: string;
    name?: string;
    plan: string;
    role: string;
    createdAt: any;
    usage?: {
        searches: number;
        lastReset: any;
    };
    apiKey?: string;
}

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onRefresh?: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, onRefresh }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        freeUsers: 0,
        basicUsers: 0,
        proUsers: 0,
        enterpriseUsers: 0,
        totalSearches: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    // onRefresh prop이 변경되면 데이터 다시 가져오기
    useEffect(() => {
        console.log('AdminDashboard: onRefresh useEffect 트리거됨');
        console.log('isOpen:', isOpen, 'onRefresh:', onRefresh);
        // isOpen이 true이고 onRefresh가 유효한 값일 때만 실행
        if (isOpen && onRefresh !== undefined && onRefresh > 0) {
            console.log('AdminDashboard: fetchUsers() 호출 중...');
            fetchUsers();
        } else {
            console.log('AdminDashboard: fetchUsers() 호출 조건 불충족 - isOpen:', isOpen, 'onRefresh:', onRefresh);
        }
    }, [onRefresh, isOpen]);

    const fetchUsers = async () => {
        try {
            console.log('fetchUsers 시작...');
            setLoading(true);
            console.log('Firebase DB 연결 상태:', db ? 'OK' : 'FAIL');
            const usersSnapshot = await getDocs(collection(db, 'users'));
            console.log('usersSnapshot 받음:', usersSnapshot);
            console.log('문서 개수:', usersSnapshot.docs.length);
            const usersList = usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            } as User));
            console.log('usersList 생성됨:', usersList);

            // 현재 로그인한 사용자 정보 가져오기
            const currentUserData = localStorage.getItem('user');
            const currentUser = currentUserData ? JSON.parse(currentUserData) : null;

            console.log('AdminDashboard: 전체 사용자 수:', usersList.length);
            console.log('AdminDashboard: 현재 로그인 사용자:', currentUser?.email);
            console.log('AdminDashboard: localStorage user 전체:', currentUser);

            // 각 사용자의 API 키 상태 로깅
            usersList.forEach(user => {
                console.log('=== 사용자 데이터 상세 분석 ===');
                console.log('전체 사용자 데이터:', user);
                console.log('사용자 필드들:');
                console.log('- uid:', user.uid);
                console.log('- email:', user.email);
                console.log('- name:', user.name);
                console.log('- displayName:', user.displayName);
                console.log('- plan:', user.plan);
                console.log('- role:', user.role);
                console.log('- apiKey:', user.apiKey ? '있음' : '없음');
                console.log('- apiKey 원본값:', user.apiKey);
                console.log('- 모든 필드 키들:', Object.keys(user));
                console.log('- 필드명 리스트:', Object.keys(user).join(', '));
                // 가능한 모든 API 키 필드명 확인
                console.log('- geminiApiKey:', user.geminiApiKey);
                console.log('- api_key:', user.api_key);
                console.log('- gemini_api_key:', user.gemini_api_key);
                console.log('- createdAt:', user.createdAt);
                console.log('- updatedAt:', user.updatedAt);
                console.log('- usage:', user.usage);
                console.log('================================');
                console.log(`사용자 ${user.email || user.displayName || user.name || 'Unknown'}: API 키 ${user.apiKey ? '✓ 있음' : '✗ 없음'} (${user.apiKey?.substring(0, 10) || 'undefined'}...)`);
            });

            // 통계 계산
            const stats = {
                totalUsers: usersList.length,
                freeUsers: usersList.filter(u => u.plan === 'free').length,
                basicUsers: usersList.filter(u => u.plan === 'basic').length,
                proUsers: usersList.filter(u => u.plan === 'pro').length,
                enterpriseUsers: usersList.filter(u => u.plan === 'enterprise').length,
                totalSearches: usersList.reduce((acc, u) => acc + (u.usage?.searches || 0), 0)
            };

            setUsers(usersList);
            setStats(stats);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUserPlan = async (uid: string, newPlan: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                plan: newPlan,
                updatedAt: new Date()
            });
            fetchUsers();
        } catch (error) {
            console.error('Error updating user plan:', error);
        }
    };

    const updateUserRole = async (uid: string, newRole: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                role: newRole,
                updatedAt: new Date()
            });
            fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const deleteUser = async (uid: string) => {
        if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
            try {
                await deleteDoc(doc(db, 'users', uid));
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const resetUserUsage = async (uid: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                'usage.searches': 0,
                'usage.lastReset': new Date()
            });
            fetchUsers();
        } catch (error) {
            console.error('Error resetting user usage:', error);
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                width: '90%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#ffffff'
                    }}>
                        관리자 대시보드
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                console.log('🔄 새로고침 버튼 클릭됨');
                                fetchUsers();
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            🔄 새로고침
                        </button>
                        <button
                            onClick={async () => {
                                console.log('관리자 테스트 API 키 추가 시작...');
                                try {
                                    await updateDoc(doc(db, 'users', 'zFZyqKsVYTNfUqE4RIXyihd3wjp1'), {
                                        apiKey: 'AIzaSyTest123456789TestApiKey',
                                        updatedAt: new Date()
                                    });
                                    console.log('관리자 API 키 추가 완료');
                                    fetchUsers();
                                } catch (error) {
                                    console.error('관리자 API 키 추가 오류:', error);
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'rgba(0, 255, 0, 0.3)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            🔑 테스트 API 키 추가
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            닫기
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>전체 사용자</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</div>
                    </div>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Free</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.freeUsers}</div>
                    </div>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Basic</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.basicUsers}</div>
                    </div>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pro</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.proUsers}</div>
                    </div>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Enterprise</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.enterpriseUsers}</div>
                    </div>
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>총 검색수</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalSearches}</div>
                    </div>
                </div>

                {/* Users Table */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            사용자 정보를 불러오는 중...
                        </div>
                    ) : (
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse'
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', color: '#374151' }}>이메일</th>
                                    <th style={{ padding: '10px', textAlign: 'left', color: '#374151' }}>이름</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#374151' }}>플랜</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#374151' }}>역할</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#374151' }}>검색수</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#374151' }}>API키</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#374151' }}>가입일</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#374151' }}>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.uid} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '10px', fontSize: '0.875rem' }}>{user.email || user.displayName || 'No Email'}</td>
                                        <td style={{ padding: '10px', fontSize: '0.875rem' }}>{user.name || user.displayName || 'No Name'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <select
                                                value={user.plan}
                                                onChange={(e) => updateUserPlan(user.uid, e.target.value)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                <option value="free">Free</option>
                                                <option value="basic">Basic</option>
                                                <option value="pro">Pro</option>
                                                <option value="enterprise">Enterprise</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <select
                                                value={user.role}
                                                onChange={(e) => updateUserRole(user.uid, e.target.value)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #d1d5db',
                                                    fontSize: '0.875rem',
                                                    backgroundColor: user.role === 'admin' ? '#fef3c7' : 'white'
                                                }}
                                            >
                                                <option value="user">사용자</option>
                                                <option value="admin">관리자</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.875rem' }}>
                                            {user.usage?.searches || 0}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.875rem' }}>
                                            {user.apiKey ? '✓' : '✗'}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.875rem' }}>
                                            {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => resetUserUsage(user.uid)}
                                                style={{
                                                    padding: '4px 8px',
                                                    marginRight: '4px',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                리셋
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => deleteUser(user.uid)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;