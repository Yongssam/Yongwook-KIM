
export enum View {
  Welcome = 'WELCOME',
  Home = 'HOME',
  Memorize = 'MEMORIZE',
  Test = 'TEST',
  Results = 'RESULTS',
}

export enum TestType {
  EN_TO_KR = 'EN_TO_KR',
  KR_TO_EN = 'KR_TO_EN',
  SPELLING = 'SPELLING',
  IMAGE_TO_EN = 'IMAGE_TO_EN',
}

export interface Lesson {
  id: number;
  title: string;
  words: string[];
}

export interface VocabularyWord {
  english: string;
  korean: string;
}

export interface Question {
    word: VocabularyWord;
    options: string[];
    correctAnswer: string;
}