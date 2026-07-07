import React, { useState } from 'react';
import { ScrollText, Save } from 'lucide-react';

export function ActionLogSettings({ serverData }: { serverData: any }) {
  const [settings, setSettings] = useState({
    channelId: '',
    events: {
      messageDelete: true,
      messageEdit: true,
      memberJoin: true,
      memberLeave: true,
      roleCreate: false,
      roleDelete: false,
      channelCreate: false,
      channelDelete: false,
      banAdd: true,
      banRemove: true,
    }
  });
  const [saved, setSaved] = useState(false);

  const textChannels = serverData.channels?.filter((c: any) => c.type === 0 || c.type === 5) || [];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleEvent = (key: keyof typeof settings.events) => {
    setSettings(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [key]: !prev.events[key]
      }
    }));
    setSaved(false);
  };

  const updateChannel = (val: string) => {
    setSettings(prev => ({ ...prev, channelId: val }));
    setSaved(false);
  };

  const eventLabels: Record<keyof typeof settings.events, string> = {
    messageDelete: 'Удаление сообщений',
    messageEdit: 'Редактирование сообщений',
    memberJoin: 'Вход на сервер',
    memberLeave: 'Выход с сервера',
    roleCreate: 'Создание ролей',
    roleDelete: 'Удаление ролей',
    channelCreate: 'Создание каналов',
    channelDelete: 'Удаление каналов',
    banAdd: 'Выдача банов',
    banRemove: 'Снятие банов',
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ScrollText className="text-indigo-400" />
            Журнал аудита
          </h2>
          <p className="text-slate-400">Настройте логирование всех важных событий на сервере.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Save size={18} /> {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#24262b] border border-white/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Канал логов</h3>
            <label className="block text-sm font-medium text-slate-300 mb-2">Выберите канал для отправки</label>
            <select 
              value={settings.channelId}
              onChange={e => updateChannel(e.target.value)}
              className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
            >
              <option value="" disabled>Выберите канал...</option>
              {textChannels.map((c: any) => <option key={c.id} value={c.id}># {c.name}</option>)}
            </select>
            <p className="text-xs text-slate-500 mt-3">Убедитесь, что у бота есть права на отправку сообщений и встраивание ссылок (Embeds) в этом канале.</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#24262b] border border-white/5 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">События для логирования</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {(Object.keys(settings.events) as Array<keyof typeof settings.events>).map(eventKey => (
              <div key={eventKey} className="flex items-center justify-between p-3 bg-[#111216] rounded-xl border border-white/5">
                <span className="text-slate-300 font-medium text-sm">{eventLabels[eventKey]}</span>
                <div 
                  className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors shrink-0 ${settings.events[eventKey] ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  onClick={() => toggleEvent(eventKey)}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.events[eventKey] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
