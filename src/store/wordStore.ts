import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Word {
  id: string;
  word: string;      // 日语单词（汉字或假名）
  reading: string;   // 假名（可选）
  date: string;      // 上传日期（yyyy-mm-dd）
}

interface WordStore {
  words: Word[];
  addWord: (word: Omit<Word, 'id'>) => boolean; // 返回是否添加成功（去重）
  addWords: (words: Omit<Word, 'id'>[]) => { added: number; duplicated: number };
  updateWord: (id: string, word: Partial<Word>) => void;
  deleteWord: (id: string) => void;
  exportWords: () => Word[];
}

function isDuplicate(words: Word[], word: Omit<Word, 'id'>) {
  return words.some(
    (w) => w.word === word.word && (w.reading || '') === (word.reading || '')
  );
}

export const useWordStore = create<WordStore>()(
  persist(
    (set, get) => ({
      words: [],
      addWord: (word) => {
        const state = get();
        if (isDuplicate(state.words, word)) {
          return false;
        }
        set((state) => ({
          words: [
            ...state.words,
            {
              ...word,
              id: crypto.randomUUID(),
            },
          ],
        }));
        return true;
      },
      addWords: (newWords) => {
        let added = 0;
        let duplicated = 0;
        newWords.forEach((word) => {
          const ok = get().addWord(word);
          if (ok) added++;
          else duplicated++;
        });
        return { added, duplicated };
      },
      updateWord: (id, word) =>
        set((state) => ({
          words: state.words.map((w) => (w.id === id ? { ...w, ...word } : w)),
        })),
      deleteWord: (id) =>
        set((state) => ({
          words: state.words.filter((w) => w.id !== id),
        })),
      exportWords: () => get().words,
    }),
    {
      name: 'word-dictation-storage',
    }
  )
); 