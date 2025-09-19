import React from 'react';
import { config, switchMode } from '../src/config/appConfig';

const ModeToggle: React.FC = () => {
    const currentMode = config.mode;
    
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        }}>
            <span style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                fontWeight: '500'
            }}>
                모드:
            </span>
            <button
                onClick={() => switchMode('local')}
                style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: currentMode === 'local' ? '#3b82f6' : '#f3f4f6',
                    color: currentMode === 'local' ? 'white' : '#374151',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                🏠 로컬
            </button>
            <button
                onClick={() => switchMode('saas')}
                style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: currentMode === 'saas' ? '#10b981' : '#f3f4f6',
                    color: currentMode === 'saas' ? 'white' : '#374151',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                ☁️ SaaS
            </button>
            
            {currentMode === 'local' && (
                <div style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    background: '#fef3c7',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#92400e'
                }}>
                    무료 • 개인 API 키 사용
                </div>
            )}
            
            {currentMode === 'saas' && (
                <div style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    background: '#d1fae5',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#065f46'
                }}>
                    클라우드 • 구독 서비스
                </div>
            )}
        </div>
    );
};

export default ModeToggle;