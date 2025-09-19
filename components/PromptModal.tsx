import React, { useState, useMemo, useEffect, useRef } from 'react';
import { promptsData, Prompt } from '../data/prompts';

interface PromptModalProps {
    onClose: () => void;
    onExecute: (prompt: string) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ onClose, onExecute }) => {
    const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
    const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
    const modalRef = useRef<HTMLDivElement>(null);

    const placeholders = useMemo(() => {
        if (!selectedPromptId) return [];
        const prompt = promptsData.flatMap(c => c.prompts).find(p => p.id === selectedPromptId);
        if (!prompt) return [];
        const matches = [...prompt.template.matchAll(/\[(.*?)\]/g)];
        return matches.map(match => match[1]);
    }, [selectedPromptId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handlePromptSelect = (id: number) => {
        if (selectedPromptId === id) {
            setSelectedPromptId(null);
        } else {
            setSelectedPromptId(id);
            setInputValues({});
        }
    };

    const handleInputChange = (placeholder: string, value: string) => {
        setInputValues(prev => ({ ...prev, [placeholder]: value }));
    };

    const handleExecuteClick = () => {
        if (!selectedPromptId) return;
        const prompt = promptsData.flatMap(c => c.prompts).find(p => p.id === selectedPromptId);
        if (!prompt) return;

        let finalPrompt = prompt.template;
        const currentYear = new Date().getFullYear();
        finalPrompt = finalPrompt.replace(/{YYYY}/g, String(currentYear));
        finalPrompt = finalPrompt.replace(/{YYYY\+1}/g, String(currentYear + 1));
        
        for (const placeholder of placeholders) {
            finalPrompt = finalPrompt.replace(`[${placeholder}]`, inputValues[placeholder] || '');
        }
        onExecute(finalPrompt);
    };

    const isExecuteDisabled = placeholders.length > 0 && placeholders.some(p => !inputValues[p]?.trim());

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div ref={modalRef} className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
                    <h2 className="text-xl font-bold text-cyan-400">키워드 파이팅 프롬프트 50</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto space-y-6">
                    {promptsData.map(category => (
                        <section key={category.category}>
                            <h3 className="text-lg font-semibold text-slate-300 mb-3">{category.category}</h3>
                            <div className="space-y-2">
                                {category.prompts.map(prompt => (
                                    <div key={prompt.id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                                        <button onClick={() => handlePromptSelect(prompt.id)} className="w-full text-left p-3 flex justify-between items-center hover:bg-slate-700/50 transition-colors" aria-expanded={selectedPromptId === prompt.id}>
                                            <span className="font-medium text-slate-200">{prompt.title}</span>
                                             <svg className={`w-5 h-5 text-slate-400 transform transition-transform shrink-0 ${selectedPromptId === prompt.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </button>
                                        {selectedPromptId === prompt.id && (
                                            <div className="p-4 border-t border-slate-700 bg-slate-900/50 space-y-4 animate-fade-in">
                                                <p className="text-sm text-slate-400 italic">"{prompt.template}"</p>
                                                {placeholders.length > 0 && (
                                                    <div className="space-y-3">
                                                        {placeholders.map(p => (
                                                            <div key={p}>
                                                                <label className="block text-sm font-medium text-cyan-300 mb-1" htmlFor={`prompt-input-${p}`}>{p}</label>
                                                                <input
                                                                    id={`prompt-input-${p}`}
                                                                    type="text"
                                                                    value={inputValues[p] || ''}
                                                                    onChange={e => handleInputChange(p, e.target.value)}
                                                                    className="w-full bg-slate-800 text-white placeholder-slate-500 border-2 border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-300"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                 <button onClick={handleExecuteClick} disabled={isExecuteDisabled} className="w-full mt-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition duration-300">
                                                    실행
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default PromptModal;