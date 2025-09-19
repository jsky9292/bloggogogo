import React, { useEffect, useState } from 'react';
import { UserProfile, checkUsageLimit } from '../src/config/firebase';

interface UserDashboardProps {
  user: UserProfile;
  onClose: () => void;
  onUpgradePlan: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onClose, onUpgradePlan }) => {
  const [remainingSearches, setRemainingSearches] = useState<number>(0);
  const [hasLimit, setHasLimit] = useState<boolean>(true);

  useEffect(() => {
    calculateRemainingSearches();
  }, [user]);

  const calculateRemainingSearches = () => {
    const limits: Record<string, number> = {
      free: 10,
      basic: 50,
      pro: 200,
      enterprise: Infinity
    };

    const used = user.usage?.searches || 0;
    const limit = limits[user.plan];

    if (limit === Infinity) {
      setHasLimit(false);
      setRemainingSearches(0);
    } else {
      setHasLimit(true);
      setRemainingSearches(Math.max(0, limit - used));
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700',
      enterprise: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
    };
    return colors[plan] || colors.free;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">사용자 대시보드</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* User Info Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">내 정보</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600">이름</label>
                  <p className="text-lg font-medium text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">이메일</label>
                  <p className="text-lg font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">가입일</label>
                  <p className="text-lg font-medium text-gray-900">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">역할</label>
                  <p className="text-lg font-medium text-gray-900">
                    {user.role === 'admin' ? '관리자' : '일반 사용자'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">구독 정보</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-bold text-gray-900">현재 플랜</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanBadgeColor(user.plan)}`}>
                      {user.plan.toUpperCase()}
                    </span>
                  </div>
                  {user.subscriptionStart && (
                    <p className="text-sm text-gray-600">
                      구독 시작일: {formatDate(user.subscriptionStart)}
                    </p>
                  )}
                  {user.subscriptionEnd && (
                    <p className="text-sm text-gray-600">
                      다음 결제일: {formatDate(user.subscriptionEnd)}
                    </p>
                  )}
                </div>
                {user.plan !== 'enterprise' && (
                  <button
                    onClick={onUpgradePlan}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                  >
                    플랜 업그레이드
                  </button>
                )}
              </div>

              {/* Usage Stats */}
              <div className="mt-6 pt-6 border-t border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">오늘의 사용량</h4>
                {hasLimit ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">키워드 분석</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.usage?.searches || 0} / {remainingSearches + (user.usage?.searches || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((user.usage?.searches || 0) / (remainingSearches + (user.usage?.searches || 0))) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {remainingSearches > 0
                        ? `오늘 ${remainingSearches}회 더 사용 가능`
                        : '오늘 사용 가능 횟수를 모두 소진했습니다'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 font-medium">무제한 사용 가능</p>
                )}
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">플랜 비교</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기능</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Free</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Pro</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">일일 검색 횟수</td>
                    <td className="px-6 py-4 text-sm text-center">10회</td>
                    <td className="px-6 py-4 text-sm text-center">50회</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">200회</td>
                    <td className="px-6 py-4 text-sm text-center">무제한</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">경쟁력 분석</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">블로그 주제 생성</td>
                    <td className="px-6 py-4 text-sm text-center">❌</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">AI 글쓰기</td>
                    <td className="px-6 py-4 text-sm text-center">❌</td>
                    <td className="px-6 py-4 text-sm text-center">❌</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">API 접근</td>
                    <td className="px-6 py-4 text-sm text-center">❌</td>
                    <td className="px-6 py-4 text-sm text-center">❌</td>
                    <td className="px-6 py-4 text-sm text-center">❌</td>
                    <td className="px-6 py-4 text-sm text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">가격</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold">무료</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold">₩9,900/월</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">₩29,900/월</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold">문의</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;