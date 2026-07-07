import React, { useState } from 'react';
import { Shield, Save, X, Plus } from 'lucide-react';

export function AutomodSettings({ serverData }: { serverData: any }) {
  const [settings, setSettings] = useState({
    antiSpam: true,
    antiInvites: true,
    antiCaps: false,
    antiLinks: false,
  });
  const [badWords, setBadWords] = useState<string[]>(['дурак', 'идиот', 'спам']);
  const [newWord, setNewWord] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const addWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || badWords.includes(newWord.trim().toLowerCase())) return;
    setBadWords([...badWords, newWord.trim().toLowerCase()]);
    setNewWord('');
    setSaved(false);
  };

  const removeWord = (word: string) => {
    setBadWords(badWords.filter(w => w !== word));
    setSaved(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="text-indigo-400" />
            Автомодерация
          </h2>
          <p className="text-slate-400">Настройте автоматические фильтры для защиты сервера.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Save size={18} /> {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#24262b] border border-white/5 rounded-2xl p-6 space-y-6">
          <h3 className="text-xl font-bold text-white mb-6">Основные фильтры</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white mb-1">Анти-спам</h4>
              <p className="text-sm text-slate-400">Блокировка частых одинаковых сообщений</p>
            </div>
            <div 
              className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.antiSpam ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => toggleSetting('antiSpam')}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.antiSpam ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white mb-1">Анти-инвайт</h4>
              <p className="text-sm text-slate-400">Удаление ссылок на другие Discord серверы</p>
            </div>
            <div 
              className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.antiInvites ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => toggleSetting('antiInvites')}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.antiInvites ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white mb-1">Анти-капс</h4>
              <p className="text-sm text-slate-400">Удаление сообщений с большим количеством ЗАГЛАВНЫХ БУКВ</p>
            </div>
            <div 
              className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.antiCaps ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => toggleSetting('antiCaps')}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.antiCaps ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white mb-1">Анти-ссылки</h4>
              <p className="text-sm text-slate-400">Блокировка любых внешних ссылок (кроме разрешенных ролей)</p>
            </div>
            <div 
              className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.antiLinks ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => toggleSetting('antiLinks')}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.antiLinks ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>

        <div className="bg-[#24262b] border border-white/5 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-2">Запрещенные слова</h3>
          <p className="text-sm text-slate-400 mb-6">Сообщения, содержащие эти слова, будут удаляться автоматически.</p>

          <form onSubmit={addWord} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              placeholder="Добавить слово..." 
              className="flex-1 bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
            />
            <button 
              type="submit"
              disabled={!newWord.trim()}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {badWords.length === 0 ? (
              <p className="text-slate-500 text-sm">Список пуст.</p>
            ) : (
              badWords.map(word => (
                <div key={word} className="flex items-center gap-2 bg-[#111216] border border-white/5 px-3 py-1.5 rounded-lg group">
                  <span className="text-slate-300 text-sm">{word}</span>
                  <button 
                    onClick={() => removeWord(word)}
                    className="text-slate-500 hover:text-rose-400 transition-colors opacity-50 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
