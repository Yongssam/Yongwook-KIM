
import React, { useState, useRef, useEffect } from 'react';
import { VocabularyWord, TestType } from '../types';
import { getAudioForWord } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface TestResultsProps {
  score: number;
  total: number;
  incorrectWords: VocabularyWord[];
  testType: TestType;
  onRetry: () => void;
  onRetryIncorrect: (words: VocabularyWord[]) => void;
  onHome: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ score, total, incorrectWords, testType, onRetry, onRetryIncorrect, onHome }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Fix for webkitAudioContext TypeScript error
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const handlePlayAudio = async (word: string) => {
    if (playingWord) return;
    setPlayingWord(word);
    try {
        const audioData = await getAudioForWord(word);
        const ctx = audioContextRef.current;
        if (audioData && ctx) {
            const decodedBytes = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
            source.onended = () => setPlayingWord(null);
        } else {
            setPlayingWord(null);
        }
    } catch (error) {
        console.error("Failed to play audio", error);
        setPlayingWord(null);
    }
  };


  const getResultMessage = () => {
    if (percentage === 100) return "완벽해요! 🥳";
    if (percentage >= 80) return "훌륭해요! 👍";
    if (percentage >= 50) return "잘했어요! 😊";
    return "조금 더 노력해봐요! 💪";
  };
  
  return (
    <div className="flex flex-col items-center w-full text-center">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">테스트 결과</h2>
      <p className="text-xl text-slate-600 mb-4">{getResultMessage()}</p>
      
      <div className="my-6">
        <p className="text-5xl font-bold text-blue-600">{score} <span className="text-3xl text-slate-400 font-normal">/ {total}</span></p>
        <p className="text-lg text-slate-500 mt-2">정답률: {percentage}%</p>
      </div>

      {incorrectWords.length > 0 && (
        <div className="w-full max-w-md my-4">
          <h3 className="text-xl font-semibold mb-3 text-left">틀린 단어</h3>
          <ul className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 text-left">
            {incorrectWords.map((word, index) => (
              <li key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handlePlayAudio(word.english)} 
                        disabled={!!playingWord}
                        className="p-1 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                        {playingWord === word.english ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div> : <SpeakerIcon className="w-5 h-5 text-slate-600"/>}
                    </button>
                    <span className="font-semibold text-slate-700">{word.english}</span>
                </div>
                <span className="text-red-700">{word.korean}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button onClick={onRetry} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
          전체 다시 풀기
        </button>
        {incorrectWords.length > 0 && (
          <button onClick={() => onRetryIncorrect(incorrectWords)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
            틀린 단어만 다시 풀기
          </button>
        )}
        <button onClick={onHome} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors">
          홈으로
        </button>
      </div>
    </div>
  );
};

export default TestResults;
