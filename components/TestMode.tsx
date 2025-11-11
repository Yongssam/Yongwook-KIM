
import React, { useState, useEffect, useMemo } from 'react';
import { VocabularyWord, Question, TestType } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { generateImage } from '../services/geminiService';

interface TestModeProps {
  vocabulary: VocabularyWord[];
  testType: TestType;
  onTestComplete: (score: number, incorrectWords: VocabularyWord[]) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

const TestMode: React.FC<TestModeProps> = ({ vocabulary, testType, onTestComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [spellingInput, setSpellingInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<VocabularyWord[]>([]);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  useEffect(() => {
    const generateQuestions = (): Question[] => {
      const shuffledVocab = shuffleArray(vocabulary);
      if (testType === TestType.SPELLING) {
        // Fix: Explicitly type 'word' to resolve type inference issues.
        return shuffledVocab.map((word: VocabularyWord) => ({
          word,
          options: [],
          correctAnswer: word.english,
        }));
      }

      // Fix: Explicitly type 'word' and 'v' to resolve type inference issues.
      return shuffledVocab.map((word: VocabularyWord) => {
        const isKrBased = testType === TestType.KR_TO_EN || testType === TestType.IMAGE_TO_EN;
        const correctAnswer = isKrBased ? word.english : word.korean;
        const distractors = shuffleArray(vocabulary.filter((v: VocabularyWord) => (isKrBased ? v.english : v.korean) !== correctAnswer))
          .slice(0, 3)
          .map((v: VocabularyWord) => isKrBased ? v.english : v.korean);
        const options = shuffleArray([correctAnswer, ...distractors]);
        return { word, options, correctAnswer };
      });
    };
    setQuestions(generateQuestions());
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setSpellingInput('');
    setIsAnswered(false);
    setScore(0);
    setIncorrectWords([]);
  }, [vocabulary, testType]);
  
  useEffect(() => {
    if (testType !== TestType.IMAGE_TO_EN || questions.length === 0) return;
    
    let isActive = true;
    const fetchImage = async () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        setIsImageLoading(true);
        setImageUrl(null);
        try {
            const url = await generateImage(currentQuestion.word.english);
            if (isActive) {
                setImageUrl(url);
            }
        } catch (error) {
            console.error('Failed to load image for question', error);
            if (isActive) {
               setImageUrl(null); // Or a placeholder error image
            }
        } finally {
            if (isActive) {
                setIsImageLoading(false);
            }
        }
    };

    fetchImage();

    return () => { isActive = false; };
  }, [currentQuestionIndex, questions, testType]);


  const handleSubmitAnswer = () => {
    if (isAnswered) return;

    let isCorrect = false;

    if (testType === TestType.SPELLING) {
        isCorrect = spellingInput.trim().toLowerCase() === questions[currentQuestionIndex].correctAnswer.toLowerCase();
    } else {
        isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
    }

    setIsAnswered(true);

    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setIncorrectWords(prev => [...prev, questions[currentQuestionIndex].word]);
    }
  };


  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setSpellingInput('');
      setIsAnswered(false);
    } else {
      onTestComplete(score, incorrectWords);
    }
  };
  
  // For multiple choice
  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };
  
  useEffect(() => {
    if (selectedAnswer !== null) {
        handleSubmitAnswer();
    }
  }, [selectedAnswer]);


  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'bg-white hover:bg-slate-100 border-slate-300';
    }
    const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      return 'bg-green-100 border-green-400 text-green-800';
    }
    if (option === selectedAnswer && !isCorrect) {
      return 'bg-red-100 border-red-400 text-red-800';
    }
    return 'bg-white border-slate-300 opacity-70';
  };

  if (questions.length === 0) {
    return <div>Loading test...</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const getQuestionContent = () => {
    switch(testType) {
        case TestType.EN_TO_KR:
            return {
                prompt: '다음 단어의 뜻은 무엇일까요?',
                content: <p className="text-4xl font-bold my-4 text-blue-600">{currentQuestion.word.english}</p>
            };
        case TestType.KR_TO_EN:
            return {
                prompt: '다음 뜻의 영단어는 무엇일까요?',
                content: <p className="text-4xl font-bold my-4 text-blue-600">{currentQuestion.word.korean}</p>
            };
        case TestType.SPELLING:
             return {
                prompt: '다음 뜻의 영단어를 입력하세요.',
                content: <p className="text-4xl font-bold my-4 text-blue-600">{currentQuestion.word.korean}</p>
            };
        case TestType.IMAGE_TO_EN:
            return {
                prompt: '다음 그림에 해당하는 단어는 무엇일까요?',
                content: (
                    <div className="w-full h-48 my-4 flex items-center justify-center">
                        {isImageLoading ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                        ) : imageUrl ? (
                            <img src={imageUrl} alt="Vocabulary quiz" className="max-w-full max-h-full object-contain rounded-lg" />
                        ) : (
                            <p className="text-slate-500">이미지를 불러올 수 없습니다.</p>
                        )}
                    </div>
                )
            };
        default:
             return { prompt: '', content: null };
    }
  };

  const { prompt, content } = getQuestionContent();

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-bold text-slate-700 mb-2">단어 테스트</h2>
      <p className="text-slate-500 mb-4">{currentQuestionIndex + 1} / {questions.length}</p>

      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      
      <div className="w-full max-w-lg p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
        <p className="text-sm text-slate-500">{prompt}</p>
        {content}
      </div>
      
      {testType === TestType.SPELLING ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(); }} className="mt-6 w-full max-w-lg">
            <input 
                type="text"
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                disabled={isAnswered}
                className={`w-full p-4 border-2 rounded-lg text-lg text-center transition-all ${isAnswered ? (spellingInput.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="영단어를 입력하세요"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
            />
             {isAnswered && spellingInput.trim().toLowerCase() !== currentQuestion.correctAnswer.toLowerCase() && (
                <p className="text-center text-green-600 mt-2">정답: {currentQuestion.correctAnswer}</p>
            )}
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 w-full max-w-lg">
            {currentQuestion.options.map((option, index) => (
            <button 
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
                className={`p-4 rounded-lg border-2 text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${getButtonClass(option)}`}
            >
                <span>{option}</span>
                {isAnswered && option === selectedAnswer && option !== currentQuestion.correctAnswer && <XIcon className="w-6 h-6 text-red-600" />}
                {isAnswered && option === currentQuestion.correctAnswer && <CheckIcon className="w-6 h-6 text-green-600" />}
            </button>
            ))}
        </div>
      )}
      
      
      {isAnswered ? (
        <div className="mt-6 w-full max-w-lg text-center">
          <button onClick={handleNextQuestion} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            {currentQuestionIndex < questions.length - 1 ? '다음 문제' : '결과 보기'}
          </button>
        </div>
      ) : (
        testType === TestType.SPELLING && (
            <div className="mt-6 w-full max-w-lg text-center">
                <button onClick={handleSubmitAnswer} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
                    확인
                </button>
            </div>
        )
      )}
    </div>
  );
};

export default TestMode;