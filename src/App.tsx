import React, { useState } from 'react';
import { Shield, UserPlus, SmilePlus, TerminalSquare, ScrollText, Settings, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('automod');

  const tabs = [
    { id: 'automod', label: 'Автомодерация', icon: <Shield size={18} /> },
    { id: 'welcome', label: 'Приветствия', icon: <UserPlus size={18} /> },
    { id: 'reaction_roles', label: 'Выдача ролей (Реакции)', icon: <SmilePlus size={18} /> },
    { id: 'custom_commands', label: 'Кастомные команды', icon: <TerminalSquare size={18} /> },
    { id: 'action_log', label: 'Журнал аудита', icon: <ScrollText size={18} /> },
    { id: 'settings', label: 'Глобальные настройки', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[150px]"></div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">E</div>
          <span className="text-xl font-bold tracking-tight text-white">[EAC]-Helper <span className="text-indigo-400 text-sm font-medium">Dashboard</span></span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span className="text-indigo-400 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> System Online</span>
          <div className="px-4 py-2 bg-white/10 rounded-full border border-white/10">Connected: prod-firestore-db</div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 p-8 overflow-hidden h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="col-span-3 flex flex-col gap-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-4 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 px-2">Модули</p>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="col-span-9 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-8 overflow-y-auto">
          {activeTab === 'automod' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="text-indigo-400" />
                    Автомодерация
                  </h2>
                  <p className="text-slate-400">Настройте автоматические фильтры для защиты вашего сервера.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full border border-indigo-500/30">
                  <Zap size={16} /> Модуль активен
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Анти-Спам</h3>
                    <div className="w-10 h-6 bg-indigo-500 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Автоматически удаляет сообщения при частой отправке (спаме).</p>
                </div>
                
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Удаление Инвайтов</h3>
                    <div className="w-10 h-6 bg-indigo-500 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Блокирует ссылки-приглашения на другие Discord серверы.</p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Анти-Капс</h3>
                    <div className="w-10 h-6 bg-indigo-500 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Удаляет сообщения, содержащие более 70% заглавных букв.</p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Фильтр плохих слов</h3>
                    <div className="w-10 h-6 bg-indigo-500 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">Фильтрует сообщения по списку запрещенных слов.</p>
                  <textarea 
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none h-24"
                    placeholder="Введите слова через запятую..."
                    defaultValue="discord.gg, badword1, badword2"
                  ></textarea>
                  <button className="mt-3 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">Сохранить список</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'welcome' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <UserPlus className="text-indigo-400" />
                    Приветствия
                  </h2>
                  <p className="text-slate-400">Настройте сообщения, когда участники заходят или покидают сервер.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">Сообщение при входе (Welcome)</h3>
                    <div className="w-10 h-6 bg-indigo-500 rounded-full flex items-center p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Канал для приветствий</label>
                      <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500">
                        <option>#welcome</option>
                        <option>#general</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Текст сообщения</label>
                      <textarea 
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none h-24"
                        defaultValue="Привет, {user}! Добро пожаловать на сервер **{server}**. Ты наш {membercount} участник!"
                      ></textarea>
                      <p className="text-xs text-slate-500 mt-1">Переменные: {'{user}'}, {'{server}'}, {'{membercount}'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reaction_roles' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <SmilePlus className="text-indigo-400" />
                    Выдача ролей по реакциям
                  </h2>
                  <p className="text-slate-400">Позвольте участникам самим выбирать роли, нажимая на эмодзи.</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center py-12">
                <SmilePlus size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Нет активных сообщений</h3>
                <p className="text-slate-400 mb-6">Создайте сообщение, чтобы участники могли получать роли.</p>
                <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors">Создать Reaction Role</button>
              </div>
            </div>
          )}

          {activeTab === 'custom_commands' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <TerminalSquare className="text-indigo-400" />
                    Кастомные команды
                  </h2>
                  <p className="text-slate-400">Создавайте свои команды с уникальными ответами.</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center py-12">
                <TerminalSquare size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Пока нет кастомных команд</h3>
                <p className="text-slate-400 mb-6">Добавьте свою первую команду для сервера.</p>
                <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors">Добавить команду</button>
              </div>
            </div>
          )}

          {activeTab === 'action_log' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <ScrollText className="text-indigo-400" />
                    Журнал аудита
                  </h2>
                  <p className="text-slate-400">Отслеживайте все события на сервере в одном канале.</p>
                </div>
              </div>
              
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">Канал логов</h3>
                    <select className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500">
                        <option>#audit-logs</option>
                        <option>#admin-logs</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    {['Удаление сообщений', 'Изменение сообщений', 'Баны и кики', 'Изменение ролей', 'Вход/выход участников'].map(log => (
                      <div key={log} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-slate-300">{log}</span>
                        <div className="w-10 h-6 bg-indigo-500 rounded-full flex items-center p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Settings className="text-indigo-400" />
                    Глобальные настройки
                  </h2>
                  <p className="text-slate-400">Основные параметры сервера.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
