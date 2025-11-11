import React, { useState, useEffect, useRef } from 'react';
import { Lesson, VocabularyWord, TestType } from '../types';
import { FlipIcon } from './icons/FlipIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { generateImage, getAudioForWord, generateExampleSentence } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface MemorizationModeProps {
  lesson: Lesson;
  vocabulary: VocabularyWord[];
  onStartTest: (testType: TestType) => void;
  onBack: () => void;
}

const MemorizationMode: React.FC<MemorizationModeProps> = ({ lesson, vocabulary, onStartTest, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [exampleSentence, setExampleSentence] = useState<string | null>(null);
  const [isExampleLoading, setIsExampleLoading] = useState<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentWord = vocabulary[currentIndex];

  useEffect(() => {
    // Fix for webkitAudioContext TypeScript error
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    
    const fetchImage = async () => {
      if (!currentWord) return;

      if (isActive) {
        setIsFlipped(false);
        setIsImageLoading(true);
        setImageUrl(null);
        setExampleSentence(null);
      }

      try {
        const generatedImageUrl = await generateImage(currentWord.english);
        if (isActive) {
          setImageUrl(generatedImageUrl);
        }
      } catch (error) {
        console.error(`Failed to generate image for ${currentWord.english}:`, error);
        if (isActive) {
          setImageUrl(null);
        }
      } finally {
        if (isActive) {
          setIsImageLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isActive = false;
    };
  }, [currentWord]);

  const handleFlip = async () => {
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);

    // Fetch example sentence only when flipping to the back for the first time
    if (newFlippedState && !exampleSentence && !isExampleLoading) {
        setIsExampleLoading(true);
        try {
            const sentence = await generateExampleSentence(currentWord.english);
            setExampleSentence(sentence);
        } catch (error) {
            console.error("Failed to get example sentence", error);
            setExampleSentence("예문을 불러올 수 없습니다.");
        } finally {
            setIsExampleLoading(false);
        }
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
  };
  
  const handlePlayAudio = async () => {
    if (isAudioLoading || !currentWord) return;
    setIsAudioLoading(true);
    try {
        const audioData = await getAudioForWord(currentWord.english);
        const ctx = audioContextRef.current;
        if (audioData && ctx) {
            const decodedBytes = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
        }
    } catch (error) {
        console.error("Failed to play audio", error);
    } finally {
        setIsAudioLoading(false);
    }
  };

  const progressPercentage = ((currentIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700">&larr; 레슨 선택</button>
        <h2 className="text-xl font-bold text-center text-slate-700">{lesson.title}</h2>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* Flashcard */}
      <div className="w-full max-w-md h-80 perspective-1000 my-4">
        <div 
          className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={handleFlip}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white border-2 border-blue-300 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden">
             <div className="flex-grow w-full flex items-center justify-center mb-4">
              {isImageLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              ) : imageUrl ? (
                <img src={imageUrl} alt={currentWord.english} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-slate-400 text-center px-4">
                  <p>이미지를 불러올 수 없습니다.</p>
                </div>
              )}
            </div>
            <div className="text-3xl font-bold tracking-wider flex-shrink-0 flex items-center gap-2">
              <span>{currentWord.english}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }} 
                disabled={isAudioLoading} 
                className="p-1 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Listen to ${currentWord.english}`}
              >
                {isAudioLoading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div> : <SpeakerIcon className="w-6 h-6 text-slate-500" />}
              </button>
            </div>
            <FlipIcon className="absolute bottom-4 right-4 text-slate-400 w-6 h-6" />
          </div>
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-blue-100 border-2 border-blue-300 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer rotate-y-180">
            <p className="text-4xl font-bold text-blue-800">{currentWord.korean}</p>
            <div className="mt-4 text-slate-600 border-t border-blue-300 pt-4 w-full">
                {isExampleLoading ? (
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4 mx-auto"></div>
                ) : (
                    <p className="italic">"{exampleSentence}"</p>
                )}
            </div>
            <FlipIcon className="absolute bottom-4 right-4 text-slate-400 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-md my-4">
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span>진행도</span>
          <span>{currentIndex + 1} / {vocabulary.length}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between w-full max-w-md">
        <button onClick={goToPrev} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-8 rounded-lg transition-colors">이전</button>
        <button onClick={goToNext} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-8 rounded-lg transition-colors">다음</button>
      </div>
      
      {/* Start Test Section */}
      <div className="w-full max-w-md mt-10 border-t pt-6">
        <h3 className="text-lg font-semibold text-center mb-4 text-slate-700">학습이 끝났나요? 테스트에 도전해보세요!</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <button onClick={() => onStartTest(TestType.EN_TO_KR)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">영단어 퀴즈</button>
            <button onClick={() => onStartTest(TestType.KR_TO_EN)} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">한글 뜻 퀴즈</button>
            <button onClick={() => onStartTest(TestType.IMAGE_TO_EN)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">이미지 퀴즈</button>
            <button onClick={() => onStartTest(TestType.SPELLING)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">스펠링 퀴즈</button>
        </div>
      </div>
    </div>
  );
};

export default MemorizationMode;