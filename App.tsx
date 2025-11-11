
import React, { useState, useCallback, useEffect } from 'react';
import LessonSelector from './components/LessonSelector';
import MemorizationMode from './components/MemorizationMode';
import TestMode from './components/TestMode';
import TestResults from './components/TestResults';
import WelcomeScreen from './components/WelcomeScreen';
import { getLessonById, lessons } from './services/vocabularyService';
import { getTranslations } from './services/geminiService';
import { Lesson, View, VocabularyWord, TestType } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Welcome);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [fullVocabulary, setFullVocabulary] = useState<VocabularyWord[]>([]);
  const [testVocabulary, setTestVocabulary] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testScore, setTestScore] = useState<{ score: number; total: number; incorrectWords: VocabularyWord[] } | null>(null);
  const [currentTestType, setCurrentTestType] = useState<TestType | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
      setCompletedLessons(completed);
    } catch (e) {
      console.error("Failed to parse completed lessons from localStorage", e);
      setCompletedLessons([]);
    }
  }, []);
  
  const handleStart = () => {
    setCurrentView(View.Home);
  };

  const handleSelectLesson = useCallback(async (lessonId: number) => {
    const lesson = getLessonById(lessonId);
    if (!lesson) {
      setError('Selected lesson not found.');
      return;
    }
    
    setSelectedLesson(lesson);
    setIsLoading(true);
    setError(null);

    try {
      const translations = await getTranslations(lesson.words);
      const vocabData = lesson.words.map(word => ({
        english: word,
        korean: translations[word] || '번역 없음'
      }));
      setFullVocabulary(vocabData);
      setTestVocabulary(vocabData);
      setCurrentView(View.Memorize);
    } catch (err) {
      setError('Could not fetch translations. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartTest = (testType: TestType) => {
    setCurrentTestType(testType);
    setTestVocabulary(fullVocabulary);
    setCurrentView(View.Test);
  };

  const handleTestComplete = (score: number, incorrectWords: VocabularyWord[]) => {
    const total = testVocabulary.length;
    setTestScore({ score, total, incorrectWords });

    // Only mark lesson as complete if it was the full test
    if (selectedLesson && total === fullVocabulary.length && score / total >= 0.8) {
      setCompletedLessons(prev => {
        const newCompleted = [...new Set([...prev, selectedLesson.id])];
        localStorage.setItem('completedLessons', JSON.stringify(newCompleted));
        return newCompleted;
      });
    }
    setCurrentView(View.Results);
  };

  const handleReset = () => {
    setCurrentView(View.Home);
    setSelectedLesson(null);
    setFullVocabulary([]);
    setTestVocabulary([]);
    setTestScore(null);
    setError(null);
    setCurrentTestType(null);
  };
  
  const handleRetryTest = () => {
    setTestScore(null);
    setTestVocabulary(fullVocabulary);
    setCurrentView(View.Test);
  };

  const handleRetryIncorrect = (words: VocabularyWord[]) => {
    setTestScore(null);
    setTestVocabulary(words);
    setCurrentView(View.Test);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-slate-600">단어 뜻을 불러오는 중...</p>
          <p className="text-sm text-slate-500">잠시만 기다려주세요.</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <h2 className="text-xl font-bold mb-2">오류 발생</h2>
          <p>{error}</p>
          <button onClick={handleReset} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            돌아가기
          </button>
        </div>
      );
    }
    
    switch (currentView) {
      case View.Welcome:
        return <WelcomeScreen onStart={handleStart} />;
      case View.Memorize:
        return selectedLesson && <MemorizationMode lesson={selectedLesson} vocabulary={fullVocabulary} onStartTest={handleStartTest} onBack={handleReset} />;
      case View.Test:
        // Add a key to force re-mount when retrying with different vocabulary
        return selectedLesson && currentTestType !== null && <TestMode key={testVocabulary.map(v => v.english).join(',')} vocabulary={testVocabulary} testType={currentTestType} onTestComplete={handleTestComplete} />;
      case View.Results:
        return testScore && currentTestType !== null && <TestResults {...testScore} testType={currentTestType} onRetry={handleRetryTest} onRetryIncorrect={handleRetryIncorrect} onHome={handleReset} />;
      case View.Home:
      default:
        return <LessonSelector lessons={lessons} completedLessonIds={completedLessons} onSelectLesson={handleSelectLesson} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 tracking-tight">
          초등 영단어 마스터
        </h1>
        <p className="text-slate-500 mt-2">레슨을 선택하고 단어 학습을 시작하세요!</p>
      </header>
      <main className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {renderContent()}
      </main>
      <footer className="mt-8 text-center text-slate-400 text-sm">
        <p>Powered by React, Tailwind CSS, and Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;