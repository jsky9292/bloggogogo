import React, { useState } from 'react';
import PromptModal from './PromptModal';

interface PromptLauncherProps {
    onExecute: (prompt: string) => void;
}

const PromptLauncher: React.FC<PromptLauncherProps> = ({ onExecute }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleExecute = (prompt: string) => {
        onExecute(prompt);
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center shadow-sm">
                 <h2 className="text-lg font-bold text-blue-800 mb-3">프롬프트 라이브러리</h2>
                <button
                    onClick={handleOpenModal}
                    className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold py-3 px-6 rounded-md hover:from-blue-700 hover:to-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center shrink-0 shadow-md hover:shadow-lg"
                >
                    SEO 프롬프트 50
                </button>
            </div>
            {isModalOpen && (
                <PromptModal
                    onClose={handleCloseModal}
                    onExecute={handleExecute}
                />
            )}
        </>
    );
};

export default PromptLauncher;
