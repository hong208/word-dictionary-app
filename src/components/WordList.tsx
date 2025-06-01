import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useWordStore } from '../store/wordStore';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function speakJapanese(text: string) {
  const utter = new window.SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
  if (jaVoice) utter.voice = jaVoice;
  utter.lang = 'ja-JP';
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
}

export function WordList() {
  const { words, addWord, addWords, deleteWord, exportWords } = useWordStore();
  const [newWord, setNewWord] = useState({ word: '', reading: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 导入Excel
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      // 支持两列：word, reading
      const today = getTodayStr();
      const importedWords = jsonData.map((row: any) => ({
        word: row.word || row['单词'] || '',
        reading: row.reading || row['假名'] || '',
        date: today,
      })).filter((w: any) => w.word);
      const { added, duplicated } = addWords(importedWords);
      alert(`成功导入 ${added} 个单词，重复 ${duplicated} 个未导入。`);
    };
    reader.readAsBinaryString(file);
  };

  // 导出Excel
  const handleExport = () => {
    const data = exportWords();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Words');
    XLSX.writeFile(workbook, 'word-list.xlsx');
  };

  // 添加单词
  const handleAddWord = () => {
    if (!newWord.word) return;
    const today = getTodayStr();
    const ok = addWord({ ...newWord, date: today });
    if (!ok) {
      alert('该单词（含假名）已存在，未添加！');
      return;
    }
    setNewWord({ word: '', reading: '' });
  };

  // 选择相关
  const handleSelectAll = () => {
    setSelectedIds(words.map((w) => w.id));
  };
  const handleInvertSelect = () => {
    setSelectedIds(words.filter((w) => !selectedIds.includes(w.id)).map((w) => w.id));
  };
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 个单词吗？`)) return;
    selectedIds.forEach((id) => deleteWord(id));
    setSelectedIds([]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex-1">
          <Label htmlFor="import">导入单词（支持Excel，列名：word/单词，reading/假名）</Label>
          <Input
            id="import"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={handleExport}>导出单词表</Button>
          <Button variant="outline" onClick={() => window.open('/word_template.csv', '_blank')}>下载模板</Button>
        </div>
      </div>

      <div className="grid gap-4 p-4 border rounded-lg">
        <h2 className="text-xl font-bold">添加新单词</h2>
        <div className="grid gap-2">
          <Label htmlFor="word">单词（汉字或假名）</Label>
          <Input
            id="word"
            value={newWord.word}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWord((prev) => ({ ...prev, word: e.target.value }))}
            placeholder="请输入日语单词"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reading">假名（可选）</Label>
          <Input
            id="reading"
            value={newWord.reading}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWord((prev) => ({ ...prev, reading: e.target.value }))}
            placeholder="请输入假名（可选）"
          />
        </div>
        <Button onClick={handleAddWord}>添加单词</Button>
      </div>

      <div className="flex gap-2 mb-2">
        <Button size="sm" onClick={handleSelectAll}>全选</Button>
        <Button size="sm" onClick={handleInvertSelect}>反选</Button>
        <Button size="sm" variant="destructive" onClick={handleBatchDelete} disabled={selectedIds.length === 0}>批量删除</Button>
        <span className="text-sm text-gray-500 ml-2">已选 {selectedIds.length} / {words.length}</span>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === words.length && words.length > 0}
                  onChange={(e) => (e.target.checked ? setSelectedIds(words.map((w) => w.id)) : setSelectedIds([]))}
                />
              </th>
              <th className="p-2 text-left">单词</th>
              <th className="p-2 text-left">假名</th>
              <th className="p-2 text-left">上传日期</th>
              <th className="p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {words.map((word) => (
              <tr key={word.id} className="border-b">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(word.id)}
                    onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, word.id] : prev.filter((x) => x !== word.id))}
                  />
                </td>
                <td className="p-2">{word.word}</td>
                <td className="p-2">{word.reading}</td>
                <td className="p-2">{word.date}</td>
                <td className="p-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => speakJapanese(word.reading || word.word)}
                  >
                    播放
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteWord(word.id)}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 