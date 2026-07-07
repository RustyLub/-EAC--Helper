import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';

export function WelcomeSettings({ serverData }: { serverData: any }) {
  const [settings, setSettings] = useState({
    enabled: true,
    channelId: '',
    message: 'Добро пожаловать на сервер, {user}!',
    useEmbed: true,
    dmWelcome: false,
    dmMessage: 'Привет! Рады видеть тебя на нашем сервере.',
  });
  const [saved, setSaved] = useState(false);

  const textChannels = serverData.channels?.filter((c: any) => c.type === 0 || c.type === 5) || [];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <UserPlus className="text-indigo-400" />
            Приветствия
          </h2>
          <p className="text-slate-400">Настройте сообщения, которые будут отправляться новым участникам.</p>
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
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Сообщения на сервере</h3>
            <div 
              className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => updateSetting('enabled', !settings.enabled)}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div className={`space-y-4 transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Канал для приветствий</label>
              <select 
                value={settings.channelId}
                onChange={e => updateSetting('channelId', e.target.value)}
                className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
              >
                <option value="" disabled>Выберите канал...</option>
                {textChannels.map((c: any) => <option key={c.id} value={c.id}># {c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Текст сообщения</label>
              <textarea 
                value={settings.message}
                onChange={e => updateSetting('message', e.target.value)}
                className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white h-24 resize-none custom-scrollbar"
              />
              <p className="text-xs text-slate-500 mt-2">Доступные переменные: {'{user}'}, {'{server}'}, {'{memberCount}'}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="font-medium text-white text-sm">Использовать Embed</h4>
                <p className="text-xs text-slate-400">Отправлять сообщение в красивой рамке</p>
              </div>
              <div 
                className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.useEmbed ? 'bg-emerald-500' : 'bg-slate-700'}`}
                onClick={() => updateSetting('useEmbed', !settings.useEmbed)}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.useEmbed ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#24262b] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Сообщения в ЛС</h3>
            <div 
              className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${settings.dmWelcome ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => updateSetting('dmWelcome', !settings.dmWelcome)}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.dmWelcome ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div className={`space-y-4 transition-opacity ${settings.dmWelcome ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Текст сообщения в Личные Сообщения</label>
              <textarea 
                value={settings.dmMessage}
                onChange={e => updateSetting('dmMessage', e.target.value)}
                className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white h-32 resize-none custom-scrollbar"
              />
              <p className="text-xs text-slate-500 mt-2">Доступные переменные: {'{user}'}, {'{server}'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
