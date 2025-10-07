import React, { useState } from 'react';

interface NaverApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: NaverApiKeys) => void;
  currentKeys?: NaverApiKeys;
}

export interface NaverApiKeys {
  adApiKey: string;
  adSecretKey: string;
  adCustomerId: string;
  searchClientId: string;
  searchClientSecret: string;
}

const NaverApiKeyModal: React.FC<NaverApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKeys }) => {
  const [keys, setKeys] = useState<NaverApiKeys>(currentKeys || {
    adApiKey: '',
    adSecretKey: '',
    adCustomerId: '',
    searchClientId: '',
    searchClientSecret: ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    // 필수 필드 검증
    if (!keys.adApiKey || !keys.adSecretKey || !keys.adCustomerId ||
        !keys.searchClientId || !keys.searchClientSecret) {
      alert('모든 API 키를 입력해주세요.');
      return;
    }
    onSave(keys);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">네이버 API 키 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-4 space-y-6">
          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📌 API 키 발급 안내</h3>
            <p className="text-sm text-blue-800 mb-2">
              네이버 키워드 분석 기능을 사용하려면 두 가지 API 키가 필요합니다:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>네이버 광고 API</strong> - 키워드 검색량 및 경쟁강도 조회</li>
              <li><strong>네이버 검색 API</strong> - 블로그 문서 수 조회</li>
            </ol>
          </div>

          {/* 네이버 광고 API 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">1. 네이버 광고 API</h3>
              <a
                href="https://naver.worksmobile.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                발급받기 →
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={keys.adApiKey}
                onChange={(e) => setKeys({ ...keys, adApiKey: e.target.value })}
                placeholder="네이버 광고 API Key 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={keys.adSecretKey}
                onChange={(e) => setKeys({ ...keys, adSecretKey: e.target.value })}
                placeholder="네이버 광고 Secret Key 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={keys.adCustomerId}
                onChange={(e) => setKeys({ ...keys, adCustomerId: e.target.value })}
                placeholder="네이버 광고 Customer ID 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200"></div>

          {/* 네이버 검색 API 섹션 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">2. 네이버 검색 API</h3>
              <a
                href="https://developers.naver.com/apps/#/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                발급받기 →
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={keys.searchClientId}
                onChange={(e) => setKeys({ ...keys, searchClientId: e.target.value })}
                placeholder="네이버 검색 API Client ID 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={keys.searchClientSecret}
                onChange={(e) => setKeys({ ...keys, searchClientSecret: e.target.value })}
                placeholder="네이버 검색 API Client Secret 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>API 키는 브라우저 로컬 스토리지에 암호화되어 저장됩니다.</li>
              <li>다른 사람과 API 키를 공유하지 마세요.</li>
              <li>API 사용량이 일일 한도를 초과하면 사용이 제한될 수 있습니다.</li>
            </ul>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default NaverApiKeyModal;
