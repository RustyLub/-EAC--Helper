import React, { useState } from 'react';
import { Settings2, Save } from 'lucide-react';
import { SettingField } from '../data/moduleConfigs';

interface GenericModuleSettingsProps {
  moduleData: any;
  config: SettingField[];
  serverData: { channels: any[], roles: any[] };
  onBack: () => void;
}

export function GenericModuleSettings({ moduleData, config, serverData, onBack }: GenericModuleSettingsProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    config.forEach(c => {
      if (c.type === 'toggle') init[c.id] = c.default || false;
      else init[c.id] = '';
    });
    return init;
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateValue = (id: string, val: any) => {
    setValues(prev => ({ ...prev, [id]: val }));
    setSaved(false);
  };

  const textChannels = serverData.channels?.filter(c => c.type === 0 || c.type === 5) || []; // GUILD_TEXT or GUILD_ANNOUNCEMENT
  const allRoles = serverData.roles || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings2 className="text-indigo-400" />
            Настройки: {moduleData.name}
          </h2>
          <p className="text-slate-400">{moduleData.desc}</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Save size={18} /> {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>

      <div className="bg-[#24262b] border border-white/5 rounded-2xl p-6 space-y-6">
        {config.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Settings2 size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Настройки отсутствуют</h3>
            <p>У данного модуля нет изменяемых параметров или они встроены в Discord по умолчанию.</p>
          </div>
        ) : (
          config.map(field => (
            <div key={field.id} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-base font-bold text-white mb-1">{field.label}</label>
                  {field.desc && <p className="text-sm text-slate-400 leading-relaxed">{field.desc}</p>}
                </div>
                
                <div className="w-full md:w-1/2 lg:w-2/5 shrink-0">
                  {field.type === 'toggle' && (
                    <div 
                      className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${values[field.id] ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      onClick={() => updateValue(field.id, !values[field.id])}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${values[field.id] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  )}

                  {field.type === 'input' && (
                    <input 
                      type="text" 
                      className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                      placeholder={field.placeholder}
                      value={values[field.id]}
                      onChange={e => updateValue(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea 
                      className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors h-24 resize-none custom-scrollbar"
                      placeholder={field.placeholder}
                      value={values[field.id]}
                      onChange={e => updateValue(field.id, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && (
                    <select 
                      className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                      value={values[field.id]}
                      onChange={e => updateValue(field.id, e.target.value)}
                    >
                      <option value="" disabled>Выберите опцию...</option>
                      {field.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}

                  {field.type === 'channel' && (
                    <select 
                      className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                      value={values[field.id]}
                      onChange={e => updateValue(field.id, e.target.value)}
                    >
                      <option value="" disabled>Выберите канал...</option>
                      {textChannels.length > 0 ? (
                        textChannels.map((c: any) => (
                          <option key={c.id} value={c.id}># {c.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>Нет доступных каналов</option>
                      )}
                    </select>
                  )}

                  {field.type === 'role' && (
                    <select 
                      className="w-full bg-[#111216] border border-white/5 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                      value={values[field.id]}
                      onChange={e => updateValue(field.id, e.target.value)}
                    >
                      <option value="" disabled>Выберите роль...</option>
                      {allRoles.length > 0 ? (
                        allRoles.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>Нет доступных ролей</option>
                      )}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
