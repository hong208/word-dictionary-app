import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useWordStore } from '../store/wordStore';

interface Word {
  id: string;
  word: string;
  meaning: string;
  difficulty: number;
  lastPracticed?: Date;
  correctCount: number;
  incorrectCount: number;
}

interface DictationProps {
  words: Word[];
  onUpdateWord: (wordId: string, isCorrect: boolean) => void;
}

export function Dictation() {
  const { words, updateWordProgress } = useWordStore();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showMeaning, setShowMeaning] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [practiceMode, setPracticeMode] = useState<'meaning' | 'word'>('meaning');

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    setUserInput('');
    setShowMeaning(false);
    setIsCorrect(null);
  }, [currentWordIndex, practiceMode]);

  const handleCheck = () => {
    if (!currentWord) return;

    const isAnswerCorrect = practiceMode === 'meaning'
      ? userInput.toLowerCase().trim() === currentWord.word.toLowerCase()
      : userInput.toLowerCase().trim() === currentWord.meaning.toLowerCase();

    setIsCorrect(isAnswerCorrect);
    updateWordProgress(currentWord.id, isAnswerCorrect);
  };

  const handleNext = () => {
    setCurrentWordIndex((prev) => (prev + 1) % words.length);
  };

  const handleToggleMode = () => {
    setPracticeMode((prev) => (prev === 'meaning' ? 'word' : 'meaning'));
  };

  if (!currentWord) {
    return (
      <div className="p-4 text-center">
        <p>No words available for practice. Please add some words first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {practiceMode === 'meaning' ? 'Type the Word' : 'Type the Meaning'}
        </h2>
        <Button variant="outline" onClick={handleToggleMode}>
          Switch to {practiceMode === 'meaning' ? 'Meaning' : 'Word'} Mode
        </Button>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted">
          <p className="text-lg">
            {practiceMode === 'meaning' ? currentWord.meaning : currentWord.word}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Your Answer</Label>
          <Input
            id="answer"
            value={userInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
            placeholder={`Type the ${practiceMode === 'meaning' ? 'word' : 'meaning'}...`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showMeaning) {
                handleCheck();
              }
            }}
          />
        </div>

        {isCorrect !== null && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-medium">
              {isCorrect ? 'Correct!' : 'Incorrect!'}
            </p>
            {!isCorrect && (
              <p className="mt-2">
                The correct answer is: {practiceMode === 'meaning' ? currentWord.word : currentWord.meaning}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          {!showMeaning ? (
            <Button onClick={handleCheck} className="flex-1">
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1">
              Next Word
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Progress: {currentWordIndex + 1} of {words.length}
      </div>
    </div>
  );
} 