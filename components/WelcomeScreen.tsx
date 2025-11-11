
import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in">
      <div className="mb-6">
        <BookOpenIcon className="w-24 h-24 text-blue-500" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        초등 영단어 마스터에 오신 것을 환영합니다!
      </h2>
      <p className="max-w-xl text-lg text-gray-600 mb-8">
        교과서 단어를 재미있게 배우고 퀴즈로 실력을 확인해보세요.
        AI가 만들어주는 그림과 예문으로 단어 암기가 더욱 쉬워집니다.
      </p>
      <button
        onClick={onStart}
        className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform transform hover:scale-105"
      >
        학습 시작하기
      </button>
    </div>
  );
};

export default WelcomeScreen;