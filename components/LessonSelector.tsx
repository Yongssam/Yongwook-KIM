
import React, { useState, useMemo } from 'react';
import { Lesson } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { CompletedIcon } from './icons/CompletedIcon';

interface LessonSelectorProps {
  lessons: Lesson[];
  completedLessonIds: number[];
  onSelectLesson: (lessonId: number) => void;
}

const LessonSelector: React.FC<LessonSelectorProps> = ({ lessons, completedLessonIds, onSelectLesson }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = useMemo(() => {
    if (!searchQuery) {
      return lessons;
    }
    return lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lessons, searchQuery]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">학습할 레슨을 선택하세요</h2>
      
      <div className="w-full max-w-lg mb-6 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="레슨 제목으로 검색..."
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
          aria-label="Search lessons"
        />
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>

      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {filteredLessons.map((lesson) => (
            <div key={lesson.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg text-slate-800 pr-2">{lesson.title}</h3>
                {completedLessonIds.includes(lesson.id) && <CompletedIcon className="w-6 h-6 text-green-500 flex-shrink-0" />}
              </div>
              <p className="text-sm text-slate-500 mt-1 mb-4">{lesson.words.length} words</p>
              <button
                onClick={() => onSelectLesson(lesson.id)}
                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                학습 시작
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 font-semibold">검색 결과가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-2">다른 검색어를 입력해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default LessonSelector;
