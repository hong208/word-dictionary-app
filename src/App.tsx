import { useState } from 'react'
import { WordList } from './components/WordList'
import { DictationPlayer } from './components/DictationPlayer'


interface Word {
  id: string
  word: string
  meaning: string
  difficulty: number
  lastPracticed?: Date
  correctCount: number
  incorrectCount: number
}

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'today' | 'daily'>('list')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">日语单词听写播放器</h1>
          <nav className="mt-4">
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setActiveTab('list')}
              >
                单词管理
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'today'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setActiveTab('today')}
              >
                今日听写
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'daily'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setActiveTab('daily')}
              >
                每日听写
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'list' && <WordList />}
        {activeTab === 'today' && <DictationPlayer mode="today" />}
        {activeTab === 'daily' && <DictationPlayer mode="daily" />}
      </main>
    </div>
  )
}

export default App
