import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

interface User {
    uid: string;
    email: string;
    name: string;
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
        if (isOpen && onRefresh !== undefined) {
            fetchUsers();
        }
    }, [onRefresh, isOpen]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            } as User));

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
                                        <td style={{ padding: '10px', fontSize: '0.875rem' }}>{user.email}</td>
                                        <td style={{ padding: '10px', fontSize: '0.875rem' }}>{user.name}</td>
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