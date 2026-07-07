import React, { useState } from 'react';
import { SmilePlus, Plus, Trash2, Save, MessageSquare } from 'lucide-react';

export function ReactionRolesSettings({ serverData }: { serverData: any }) {
  const [messages, setMessages] = useState<{ id: string, channelId: string, messageId: string, roles: { emoji: string, roleId: string }[] }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelId, setNewChannelId] = useState('');
  const [newMessageId, setNewMessageId] = useState('');
  const [newRoles, setNewRoles] = useState<{ emoji: string, roleId: string }[]>([{ emoji: '👍', roleId: '' }]);
  const [saved, setSaved] = useState(false);

  const textChannels = serverData.channels?.filter((c: any) => c.type === 0 || c.type === 5) || [];
  const allRoles = serverData.roles || [];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addMessage = () => {
    if (!newChannelId || !newMessageId || newRoles.some(r => !r.roleId || !r.emoji)) return;
    setMessages([...messages, { id: Date.now().toString(), channelId: newChannelId, messageId: newMessageId, roles: newRoles }]);
    setNewChannelId('');
    setNewMessageId('');
    setNewRoles([{ emoji: '👍', roleId: '' }]);
    setIsCreating(false);
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const updateNewRole = (index: number, field: 'emoji' | 'roleId', value: string) => {
    const updated = [...newRoles];
    updated[index][field] = value;
    setNewRoles(updated);
  };

  const addRolePair = () => setNewRoles([...newRoles, { emoji: '👍', roleId: '' }]);
  const removeRolePair = (index: number) => setNewRoles(newRoles.filter((_, i) => i !== index));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <SmilePlus className="text-indigo-400" />
            Роли по реакциям
          </h2>
          <p className="text-slate-400">Позвольте пользователям самостоятельно получать роли, нажимая на реакции.</p>
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
            <h3 className="text-xl font-bold text-white">Сообщения с реакциями</h3>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors font-medium text-sm"
            >
              <Plus size={16} /> Добавить сообщение
            </button>
          </div>

          {isCreating && (
            <div className="mb-6 p-5 border border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Канал</label>
                  <select 
                    value={newChannelId}
                    onChange={e => setNewChannelId(e.target.value)}
                    className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="" disabled>Выберите канал...</option>
                    {textChannels.map((c: any) => <option key={c.id} value={c.id}># {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">ID сообщения</label>
                  <input 
                    type="text" 
                    value={newMessageId}
                    onChange={e => setNewMessageId(e.target.value)}
                    placeholder="Например: 123456789012345678" 
                    className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Связки Эмодзи + Роль</label>
                <div className="space-y-3">
                  {newRoles.map((rolePair, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input 
                        type="text" 
                        value={rolePair.emoji}
                        onChange={e => updateNewRole(idx, 'emoji', e.target.value)}
                        className="w-16 bg-[#111216] border border-white/5 rounded-lg p-3 text-center text-sm focus:outline-none focus:border-indigo-500 text-white"
                      />
                      <span className="text-slate-500">+</span>
                      <select 
                        value={rolePair.roleId}
                        onChange={e => updateNewRole(idx, 'roleId', e.target.value)}
                        className="flex-1 bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                      >
                        <option value="" disabled>Выберите роль...</option>
                        {allRoles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      {newRoles.length > 1 && (
                        <button onClick={() => removeRolePair(idx)} className="p-3 text-slate-500 hover:text-rose-400 bg-[#111216] rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={addRolePair}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-slate-400 rounded-lg transition-colors text-xs font-medium"
                >
                  <Plus size={14} /> Добавить еще роль
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-indigo-500/20 mt-4">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors text-sm font-medium"
                >
                  Отмена
                </button>
                <button 
                  onClick={addMessage}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Сохранить настройки сообщения
                </button>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12 border-t border-white/5">
              <MessageSquare size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
              <h4 className="text-lg font-bold text-white mb-2">Нет активных сообщений</h4>
              <p className="text-slate-400">Вы еще не настроили выдачу ролей по реакциям.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {messages.map(msg => {
                const channel = textChannels.find((c: any) => c.id === msg.channelId);
                return (
                  <div key={msg.id} className="p-4 bg-[#111216] rounded-xl border border-white/5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Канал: <span className="text-indigo-400">#{channel?.name || msg.channelId}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">ID: {msg.messageId}</div>
                      </div>
                      <button 
                        onClick={() => deleteMessage(msg.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.roles.map((r, i) => {
                        const role = allRoles.find((ar: any) => ar.id === r.roleId);
                        return (
                          <div key={i} className="flex items-center gap-2 bg-[#24262b] px-3 py-1.5 rounded-lg border border-white/5 text-sm">
                            <span>{r.emoji}</span>
                            <span className="text-slate-300 font-medium">{role?.name || r.roleId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
