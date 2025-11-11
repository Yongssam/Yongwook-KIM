
import { Lesson } from '../types';

export const lessons: Lesson[] = [
  {
    id: 1,
    title: "Lesson 1: What Grade Are You In?",
    words: ['grade', 'sixth', 'club', 'join', 'first', 'second', 'third', 'fourth', 'fifth', 'classroom', 'cousin', 'elementary', 'floor', 'spell', 'monkey', 'fantastic', 'same', 'next']
  },
  {
    id: 2,
    title: "Lesson 2: I Have a Headache",
    words: ['headache', 'stomachache', 'cold', 'fever', 'rest', 'medicine', 'doctor', 'nurse', 'wrong', 'feel', 'warm', 'drink', 'soup', 'should', 'dentist', 'office']
  },
  {
    id: 3,
    title: "Lesson 3: When Is Your Birthday?",
    words: ['birthday', 'party', 'when', 'festival', 'concert', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'wait']
  },
  {
    id: 4,
    title: "Lesson 4: Where Is the Post Office?",
    words: ['post office', 'library', 'bank', 'hospital', 'museum', 'station', 'where', 'next to', 'between', 'behind', 'in front of', 'go straight', 'turn left', 'turn right', 'block', 'excuse me']
  },
  {
    id: 5,
    title: "Lesson 5: I'm Going to See a Movie",
    words: ['movie', 'plant', 'trees', 'library', 'afternoon', 'congratulations', 'summer', 'fishing', 'sea', 'trip', 'plan', 'science', 'project', 'tomorrow', 'special', 'weekend']
  },
  {
    id: 6,
    title: "Lesson 6: He Has Short Curly Hair",
    words: ['short', 'long', 'straight', 'curly', 'hair', 'eyes', 'tall', 'wear', 'blue', 'brown', 'green', 'yellow', 'coat', 'shirt', 'pants', 'glasses', 'look like']
  }
];

export const getLessonById = (id: number): Lesson | undefined => {
  return lessons.find(lesson => lesson.id === id);
};
