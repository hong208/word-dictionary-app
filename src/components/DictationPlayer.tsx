import React, { useState, useRef } from 'react';
import { useWordStore, type Word } from '../store/wordStore';
import { Button } from './ui/button';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const quotaOptions = [10, 20, 50, 100, 200, '全部', '自定义'] as const;
type QuotaType = typeof quotaOptions[number];

type TimerType = ReturnType<typeof setTimeout> | null;

function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith('ja')) || null;
}

function speak(text: string, onend?: () => void) {
  const utter = new window.SpeechSynthesisUtterance(text);
  const voice = getJapaneseVoice();
  if (voice) utter.voice = voice;
  utter.lang = 'ja-JP';
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  if (onend) utter.onend = onend;
  window.speechSynthesis.speak(utter);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DictationPlayer({ mode }: { mode: 'today' | 'daily' }) {
  const { words } = useWordStore();
  const todayStr = getTodayStr();
  const todayWords = words.filter((w) => w.date === todayStr);
  const allWords = words;

  // 每日听写数量设置
  const [quotaType, setQuotaType] = useState<QuotaType>(10);
  const [customQuota, setCustomQuota] = useState('10');
  let dailyQuota = 10;
  if (quotaType === '全部') {
    dailyQuota = allWords.length;
  } else if (quotaType === '自定义') {
    dailyQuota = Math.min(Number(customQuota) || 1, allWords.length);
  } else {
    dailyQuota = Math.min(Number(quotaType), allWords.length);
  }

  // 播放控制
  const [isPlaying, setIsPlaying] = useState(false);
  const [playOrder, setPlayOrder] = useState<number[]>([]); // 乱序时用
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playInterval, setPlayInterval] = useState(2); // 秒
  const timerRef = useRef<TimerType>(null);

  // 当前播放列表
  let playList: Word[] = [];
  if (mode === 'today') {
    playList = todayWords;
  } else {
    playList = allWords.slice(0, dailyQuota);
  }

  // 乱序播放
  const handleShuffle = () => {
    if (!playList.length) return;
    const indices = Array.from({ length: playList.length }, (_, i) => i);
    setPlayOrder(shuffle(indices));
    setCurrentIndex(-1);
    setIsPlaying(false);
  };

  // 顺序播放
  const handleOrder = () => {
    setPlayOrder([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
  };

  // 开始播放
  const handleStart = () => {
    if (!playList.length) return;
    setIsPlaying(true);
    setCurrentIndex(0);
  };

  // 暂停
  const handlePause = () => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // 继续
  const handleResume = () => {
    setIsPlaying(true);
    if (currentIndex >= 0) playCurrent(currentIndex);
  };

  // 重播
  const handleReplay = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
    setPlayOrder(playOrder);
  };

  // 实际播放的索引
  const getPlayIndex = (index: number) =>
    playOrder.length === playList.length ? playOrder[index] : index;

  // 播放当前单词
  const playCurrent = (index: number) => {
    if (index < 0 || index >= playList.length) return;
    const playIdx = getPlayIndex(index);
    const word = playList[playIdx];
    if (!word) return;
    window.speechSynthesis.cancel();
    speak(word.reading || word.word, () => {
      if (isPlaying && index < playList.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, playInterval * 1000);
      } else {
        setIsPlaying(false);
        setCurrentIndex(-1);
      }
    });
  };

  // 监听 currentIndex 变化自动播放
  React.useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < playList.length) {
      playCurrent(currentIndex);
    }
    // eslint-disable-next-line
  }, [isPlaying, currentIndex, playOrder, playInterval]);

  // 组件卸载时清理
  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 当前单词内容
  const currentWord =
    currentIndex >= 0 && currentIndex < playList.length
      ? playList[getPlayIndex(currentIndex)]
      : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-4 items-center">
        <Button onClick={handleOrder} variant={playOrder.length === 0 ? 'default' : 'outline'}>
          顺序播放
        </Button>
        <Button onClick={handleShuffle} variant={playOrder.length > 0 ? 'default' : 'outline'}>
          乱序播放
        </Button>
        <Button onClick={handleStart} disabled={isPlaying || !playList.length}>
          开始
        </Button>
        <Button onClick={handlePause} disabled={!isPlaying}>
          暂停
        </Button>
        <Button onClick={handleResume} disabled={isPlaying || currentIndex === -1}>
          继续
        </Button>
        <Button onClick={handleReplay} disabled={!playList.length}>
          重播
        </Button>
        
        <div className="flex items-center gap-2">
          <span>播放间隔(秒):</span>
          <input
            type="number"
            min={1}
            max={10}
            value={playInterval}
            onChange={(e) => setPlayInterval(Number(e.target.value))}
            className="w-16 border rounded px-2 py-1"
          />
        </div>
        {mode === 'daily' && (
          <div className="flex items-center gap-2">
            <span>每日数量:</span>
            <select
              value={quotaType}
              onChange={(e) => setQuotaType(e.target.value as QuotaType)}
              className="border rounded px-2 py-1"
            >
              {quotaOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {quotaType === '自定义' && (
              <input
                type="number"
                min={1}
                max={allWords.length}
                value={customQuota}
                onChange={(e) => setCustomQuota(e.target.value)}
                className="w-16 border rounded px-2 py-1"
              />
            )}
          </div>
        )}
      </div>
      <div className="p-4 border rounded-lg min-h-[80px] flex flex-col items-center justify-center">
        {currentWord ? (
          <>
            <div className="text-2xl font-bold">{currentWord.word}</div>
            {currentWord.reading && (
              <div className="text-lg text-gray-500 mt-2">{currentWord.reading}</div>
            )}
          </>
        ) : (
          <div className="text-gray-400">未在播放</div>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {mode === 'today'
          ? `今日单词数：${todayWords.length}`
          : `全部单词数：${allWords.length}，本次听写：${playList.length}`}
        {isPlaying && currentIndex >= 0 && (
          <span className="ml-4">进度：{currentIndex + 1} / {playList.length}</span>
        )}
      </div>
    </div>
  );
} 