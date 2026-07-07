import React, { useState } from 'react';
import { TerminalSquare, Plus, Trash2, Save, MessageSquare } from 'lucide-react';

export function CustomCommandsSettings() {
  const [commands, setCommands] = useState<{ id: string, name: string, response: string }[]>([
    { id: '1', name: 'ping', response: 'Pong!' },
    { id: '2', name: 'rules', response: 'Please read the #rules channel.' }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCmdName, setNewCmdName] = useState('');
  const [newCmdResp, setNewCmdResp] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addCommand = () => {
    if (!newCmdName.trim() || !newCmdResp.trim()) return;
    setCommands([...commands, { id: Date.now().toString(), name: newCmdName.trim().toLowerCase(), response: newCmdResp.trim() }]);
    setNewCmdName('');
    setNewCmdResp('');
    setIsCreating(false);
  };

  const deleteCommand = (id: string) => {
    setCommands(commands.filter(c => c.id !== id));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TerminalSquare className="text-indigo-400" />
            Кастомные команды
          </h2>
          <p className="text-slate-400">Создавайте собственные текстовые команды для вашего сервера.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Save size={18} /> {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-[#24262b] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Список команд</h3>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors font-medium text-sm"
            >
              <Plus size={16} /> Создать команду
            </button>
          </div>

          {isCreating && (
            <div className="mb-6 p-5 border border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Имя команды (без префикса)</label>
                <input 
                  type="text" 
                  value={newCmdName}
                  onChange={e => setNewCmdName(e.target.value)}
                  placeholder="например: help" 
                  className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Текст ответа</label>
                <textarea 
                  value={newCmdResp}
                  onChange={e => setNewCmdResp(e.target.value)}
                  placeholder="Текст, который отправит бот..." 
                  className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white min-h-[100px] resize-none custom-scrollbar"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors text-sm font-medium"
                >
                  Отмена
                </button>
                <button 
                  onClick={addCommand}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Добавить
                </button>
              </div>
            </div>
          )}

          {commands.length === 0 ? (
            <div className="text-center py-12 border-t border-white/5">
              <MessageSquare size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
              <h4 className="text-lg font-bold text-white mb-2">Нет команд</h4>
              <p className="text-slate-400">Вы еще не создали ни одной кастомной команды.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {commands.map(cmd => (
                <div key={cmd.id} className="flex items-start justify-between p-4 bg-[#111216] rounded-xl border border-white/5 group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-indigo-400 font-mono font-bold">?{cmd.name}</span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{cmd.response}</p>
                  </div>
                  <button 
                    onClick={() => deleteCommand(cmd.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
