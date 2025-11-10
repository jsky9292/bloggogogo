import React, { useEffect, useState } from 'react';
import { BlogRankingTracker } from '../types';
import { getUserRankingTrackers, deleteRankingTracker } from '../src/config/firebase';
import { startRankingTracking, updateTrackerRanking } from '../services/rankingServiceClient';

interface RankingTrackerProps {
  userId: string;
}

const RankingTracker: React.FC<RankingTrackerProps> = ({ userId }) => {
  const [trackers, setTrackers] = useState<BlogRankingTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTracker, setNewTracker] = useState({ blogUrl: '', keyword: '', title: '' });
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadTrackers();
  }, [userId]);

  const loadTrackers = async () => {
    try {
      const data = await getUserRankingTrackers(userId);
      setTrackers(data);
    } catch (error) {
      console.error('랭킹 추적 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracker = async () => {
    if (!newTracker.blogUrl || !newTracker.keyword) {
      alert('블로그 URL과 키워드를 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      const result = await startRankingTracking(
        userId,
        newTracker.blogUrl,
        newTracker.keyword,
        newTracker.title || undefined
      );

      if (result.success) {
        alert(result.message);
        setNewTracker({ blogUrl: '', keyword: '', title: '' });
        setShowAddForm(false);
        await loadTrackers();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert('추적 시작 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracker = async (trackerId: string) => {
    try {
      setUpdating(trackerId);
      const result = await updateTrackerRanking(trackerId);

      if (result.success) {
        alert(result.message);
        await loadTrackers();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert('업데이트 실패: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteTracker = async (trackerId: string) => {
    if (!confirm('이 추적을 삭제하시겠습니까?')) return;

    try {
      await deleteRankingTracker(trackerId);
      await loadTrackers();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return <span className="text-gray-400">-</span>;

    let color = 'bg-gray-100 text-gray-700';
    if (rank <= 3) color = 'bg-yellow-100 text-yellow-700';
    else if (rank <= 10) color = 'bg-green-100 text-green-700';
    else if (rank <= 30) color = 'bg-blue-100 text-blue-700';

    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>
        {rank}위
      </span>
    );
  };

  const getRankChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;

    const change = previous - current;
    if (change === 0) return <span className="text-gray-500">-</span>;
    if (change > 0) return <span className="text-green-600">↑ {change}</span>;
    return <span className="text-red-600">↓ {Math.abs(change)}</span>;
  };

  if (loading) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold">블로그 랭킹 추적</h2>
          <p className="text-xs text-gray-500 mt-1">
            ℹ️ 네이버 검색 API 기준 참고용 순위입니다. 실제 검색 결과와 다를 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAddForm ? '취소' : '+ 새 블로그 추적'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded border">
          <h3 className="font-bold mb-3">새 블로그 추적 추가</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="블로그 URL (예: https://blog.naver.com/아이디/글번호)"
              value={newTracker.blogUrl}
              onChange={(e) => setNewTracker({ ...newTracker, blogUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="추적할 키워드 (예: 키워드 분석)"
              value={newTracker.keyword}
              onChange={(e) => setNewTracker({ ...newTracker, keyword: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="블로그 제목 (선택사항)"
              value={newTracker.title}
              onChange={(e) => setNewTracker({ ...newTracker, title: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
            <button
              onClick={handleAddTracker}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              추적 시작
            </button>
          </div>
        </div>
      )}

      {trackers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">추적 중인 블로그가 없습니다</p>
          <p className="text-sm">위의 버튼을 클릭하여 블로그 랭킹 추적을 시작하세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trackers.map((tracker) => (
            <div key={tracker.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{tracker.blogTitle || '제목 없음'}</h3>
                  <p className="text-sm text-gray-600">키워드: {tracker.targetKeyword}</p>
                  <a
                    href={tracker.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {tracker.blogUrl}
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => tracker.id && handleUpdateTracker(tracker.id)}
                    disabled={updating === tracker.id}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    {updating === tracker.id ? '업데이트 중...' : '업데이트'}
                  </button>
                  <button
                    onClick={() => tracker.id && handleDeleteTracker(tracker.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">스마트블록</div>
                  <div className="mb-1">{getRankBadge(tracker.currentSmartblockRank)}</div>
                  <div className="text-xs">
                    {getRankChange(tracker.currentSmartblockRank, tracker.previousSmartblockRank)}
                  </div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">블로그 영역</div>
                  <div className="mb-1">{getRankBadge(tracker.currentMainBlogRank)}</div>
                  <div className="text-xs">
                    {getRankChange(tracker.currentMainBlogRank, tracker.previousMainBlogRank)}
                  </div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">블로그 탭</div>
                  <div className="mb-1">{getRankBadge(tracker.currentBlogTabRank)}</div>
                  <div className="text-xs">
                    {getRankChange(tracker.currentBlogTabRank, tracker.previousBlogTabRank)}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                마지막 확인: {tracker.lastChecked ? new Date(tracker.lastChecked).toLocaleString('ko-KR') : '확인 필요'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RankingTracker;
