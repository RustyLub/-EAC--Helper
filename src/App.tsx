import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, SmilePlus, TerminalSquare, ScrollText, Settings, Zap, LayoutGrid, Search, Settings2, LogIn, Server, ChevronDown, LogOut } from 'lucide-react';
import { moduleSettingsConfig } from './data/moduleConfigs';
import { GenericModuleSettings } from './components/GenericModuleSettings';
import { AutomodSettings } from './components/modules/AutomodSettings';
import { WelcomeSettings } from './components/modules/WelcomeSettings';
import { ReactionRolesSettings } from './components/modules/ReactionRolesSettings';
import { CustomCommandsSettings } from './components/modules/CustomCommandsSettings';
import { ActionLogSettings } from './components/modules/ActionLogSettings';

const allModules = [
  { id: 'levels', name: 'Уровни', desc: 'Включает систему уровней на сервере', isNew: true, isStandard: true },
  { id: 'tickets', name: 'Тикеты', desc: 'Система тикетов с веб-панелью, приватными каналами и транскриптами.', isNew: true },
  { id: 'afk', name: 'AFK', desc: 'Позволяет участникам устанавливать статус AFK.' },
  { id: 'auto_purge', name: 'Автоочистка', desc: 'Автоматически удаляет сообщения в канале по расписанию.', isStandard: true },
  { id: 'announcements', name: 'Оповещения', desc: 'Включает оповещения о входе/выходе/банах.' },
  { id: 'action_log', name: 'Журнал аудита', desc: 'Настраиваемый журнал событий на сервере.' },
  { id: 'automod', name: 'Автомодерация', desc: 'Включает различные функции автоматической модерации.' },
  { id: 'autoresponder', name: 'Автоответчик', desc: 'Автоматические ответы на текстовые триггеры.' },
  { id: 'reminders', name: 'Напоминания', desc: 'Позволяет участникам создавать напоминания.' },
  { id: 'autoroles', name: 'Автороли', desc: 'Выдача ролей при входе, по времени и по выбору.' },
  { id: 'voice_text_linking', name: 'Связь голос/текст', desc: 'Открывает текстовый канал, когда пользователь заходит в голосовой', isStandard: true },
  { id: 'moderation', name: 'Модерация', desc: 'Включает команды модерации и журнал модераторов.' },
  { id: 'tags', name: 'Теги', desc: 'Позволяет создавать теги с текстом.' },
  { id: 'custom_commands', name: 'Кастомные команды', desc: 'Создание собственных команд с различными опциями.' },
  { id: 'fun', name: 'Развлечения', desc: 'Добавляет развлекательные команды!' },
  { id: 'slowmode', name: 'Медленный режим', desc: 'Ограничивает частоту отправки сообщений пользователями.', isStandard: true },
  { id: 'auto_message', name: 'Автосообщения', desc: 'Автоматическая отправка сообщений по таймеру.' },
  { id: 'message_embedder', name: 'Embed сообщения', desc: 'Создание и редактирование красивых сообщений!' },
  { id: 'welcome', name: 'Приветствия', desc: 'Настройка сообщений при входе пользователей.' },
  { id: 'reddit', name: 'Reddit', desc: 'Подписка на новые посты в сабреддитах.', isPremium: true },
  { id: 'auto_delete', name: 'Автоудаление', desc: 'Автоматическое удаление сообщений после отправки.' },
  { id: 'reaction_roles', name: 'Роли по реакциям', desc: 'Выдача ролей по нажатию на реакции.' },
  { id: 'starboard', name: 'Starboard', desc: 'Сохранение лучших постов сервера по реакциям.' },
  { id: 'autoban', name: 'Автобан', desc: 'Автоматический бан по правилам.' },
  { id: 'giveaways', name: 'Розыгрыши', desc: 'Проведение розыгрышей на сервере.' },
  { id: 'twitch', name: 'Twitch', desc: 'Оповещения о начале трансляций', isPremium: true },
  { id: 'forms', name: 'Формы', desc: 'Создание форм для заполнения пользователями.' },
  { id: 'youtube', name: 'YouTube', desc: 'Оповещения о новых видео', isPremium: true },
  { id: 'highlights', name: 'Хайлайты', desc: 'Уведомления в ЛС по ключевым словам в чате.' },
  { id: 'tiktok', name: 'TikTok', desc: 'Оповещения о новых видео в TikTok', isPremium: true },
  { id: 'kick', name: 'Kick', desc: 'Оповещения о начале трансляций на Kick', isPremium: true },
];

const mockServers = [
  { id: '1', name: 'EAC Development', icon: 'ED', isAdmin: true, isInvited: true },
  { id: '2', name: 'Gaming Community', icon: 'GC', isAdmin: true, isInvited: true },
  { id: '3', name: 'Anime Fans', icon: 'AF', isAdmin: true, isInvited: false },
  { id: '4', name: 'Programming Hub', icon: 'PH', isAdmin: true, isInvited: false },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState('modules');
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({
    automod: true,
    welcome: true,
    reaction_roles: true,
    custom_commands: true,
    action_log: true,
    moderation: true,
    levels: true
  });
  
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [serverData, setServerData] = useState<{ channels: any[], roles: any[] }>({ channels: [], roles: [] });

  useEffect(() => {
    if (!selectedServer) return;
    
    const fetchServerData = async () => {
      try {
        const [channelsRes, rolesRes] = await Promise.all([
          fetch(`/api/guilds/${selectedServer.id}/channels`),
          fetch(`/api/guilds/${selectedServer.id}/roles`)
        ]);
        
        let channels = [];
        let roles = [];
        
        if (channelsRes.ok) channels = await channelsRes.json();
        if (rolesRes.ok) roles = await rolesRes.json();
        
        // Filter out non-text/voice channels for simplicity if needed, but for now just pass all
        setServerData({ channels, roles });
      } catch (e) {
        console.error("Failed to fetch server data", e);
      }
    };
    
    fetchServerData();
  }, [selectedServer]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const userRes = await fetch('/api/user');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        setIsLoggedIn(true);

        const guildsRes = await fetch('/api/guilds');
        if (guildsRes.ok) {
          const guildsData = await guildsRes.json();
          // Map to match our UI format
          const formattedServers = guildsData.map((g: any) => ({
            id: g.id,
            name: g.name,
            icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
            iconFallback: g.name.substring(0, 2).toUpperCase(),
            isAdmin: true,
            isInvited: true, // we assume invited for now in the demo
          }));
          setServers(formattedServers);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUserData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(`/api/auth/url?origin=${encodeURIComponent(window.location.origin)}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для авторизации.');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUser(null);
      setServers([]);
      setSelectedServer(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleModule = (id: string) => {
    setEnabledModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { id: 'modules', label: 'Все модули', icon: <LayoutGrid size={18} /> },
    { id: 'automod', label: 'Автомодерация', icon: <Shield size={18} /> },
    { id: 'welcome', label: 'Приветствия', icon: <UserPlus size={18} /> },
    { id: 'reaction_roles', label: 'Выдача ролей', icon: <SmilePlus size={18} /> },
    { id: 'custom_commands', label: 'Кастомные команды', icon: <TerminalSquare size={18} /> },
    { id: 'action_log', label: 'Журнал аудита', icon: <ScrollText size={18} /> },
    { id: 'settings', label: 'Глобальные настройки', icon: <Settings size={18} /> },
  ];

  const handleSettingsClick = (moduleId: string) => {
    setActiveTab(moduleId);
  };

  const knownTabs = ['modules', 'automod', 'welcome', 'reaction_roles', 'custom_commands', 'action_log', 'settings'];
  const isGenericModule = !knownTabs.includes(activeTab);
  const genericModuleData = isGenericModule ? allModules.find(m => m.id === activeTab) : null;

  const filteredModules = allModules.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.desc.toLowerCase().includes(searchQuery.toLowerCase()));

  // 1. Landing Page (Not logged in or loading)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111216] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#111216] text-slate-200 font-sans flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[150px]"></div>
        </div>
        
        <div className="relative z-10 bg-[#1e1f24] border border-white/5 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center font-bold text-white text-4xl mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            E
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">[EAC]-Helper</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Мощный Discord бот для управления вашим сервером. Автомодерация, логирование, кастомные команды и многое другое.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5865F2]/20"
          >
            <LogIn size={20} />
            Войти через Discord
          </button>
        </div>
      </div>
    );
  }

  // 2. Server Selector
  if (isLoggedIn && !selectedServer) {
    return (
      <div className="min-h-screen bg-[#111216] text-slate-200 font-sans flex flex-col relative overflow-hidden">
        <nav className="relative z-10 h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#1e1f24] shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">E</div>
            <span className="text-xl font-bold tracking-tight text-white">[EAC]-Helper</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium text-white">{user.username}</span>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </nav>

        <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full p-8 pt-16">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold text-white mb-4">Выберите сервер</h1>
            <p className="text-slate-400 text-lg">Выберите сервер для настройки параметров бота</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {servers.length === 0 ? (
               <div className="col-span-full text-center text-slate-400 py-12">
                 У вас нет серверов, где вы являетесь администратором.
               </div>
            ) : servers.map((server) => (
              <div 
                key={server.id} 
                className="bg-[#1e1f24] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.2)]"
              >
                {server.icon ? (
                  <img src={server.icon} alt={server.name} className="w-20 h-20 rounded-full mb-4 shadow-lg" />
                ) : (
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
                    {server.iconFallback}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-6 line-clamp-1 w-full">{server.name}</h3>
                
                {server.isInvited ? (
                  <button 
                    onClick={() => setSelectedServer(server)}
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Настроить
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedServer(server)}
                    className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Пригласить
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // 3. Dashboard (Logged in & Server Selected)
  return (
    <div className="min-h-screen bg-[#111216] text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#1e1f24] shadow-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedServer(null)}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">E</div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">[EAC]-Helper</span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowServerDropdown(!showServerDropdown)}
              className="flex items-center gap-3 bg-[#111216] border border-white/5 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              {selectedServer.icon ? (
                <img src={selectedServer.icon} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {selectedServer.iconFallback}
                </div>
              )}
              <span className="font-medium text-sm text-white">{selectedServer.name}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {showServerDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1f24] border border-white/5 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 space-y-1">
                  {servers.map(server => (
                    <button 
                      key={server.id}
                      onClick={() => { setSelectedServer(server); setShowServerDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedServer.id === server.id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {server.icon ? (
                        <img src={server.icon} alt="" className="w-6 h-6 rounded-full shrink-0" />
                      ) : (
                        <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {server.iconFallback}
                        </div>
                      )}
                      <span className="font-medium text-sm truncate">{server.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/5 p-2">
                  <button 
                    onClick={() => { setSelectedServer(null); setShowServerDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Server size={16} /> Показать все серверы
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          {user && (
            <div className="hidden sm:flex items-center gap-2 border-r border-white/10 pr-6">
              <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium text-white">{user.username}</span>
            </div>
          )}
          <span className="text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Система онлайн</span>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 p-8 overflow-hidden h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="col-span-3 lg:col-span-2 flex flex-col gap-4 bg-[#1e1f24] border border-white/5 rounded-2xl p-4 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 px-2">Управление</p>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {tab.icon}
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="col-span-9 lg:col-span-10 bg-[#1e1f24] border border-white/5 rounded-2xl p-8 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'modules' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <LayoutGrid className="text-indigo-400" />
                  Модули
                </h2>
              </div>
              
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Поиск модулей..." 
                  className="w-full bg-[#111216] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 text-white transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredModules.map((module) => (
                  <div key={module.id} className="bg-[#24262b] border border-white/5 rounded-xl p-5 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-lg">{module.name}</h3>
                          {module.isNew && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-md">Новый</span>}
                          {module.isStandard && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 rounded-md">Стандарт</span>}
                          {module.isPremium && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 rounded-md">Премиум</span>}
                        </div>
                        <div 
                          className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${enabledModules[module.id] ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabledModules[module.id] ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-6 leading-relaxed line-clamp-2">{module.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleSettingsClick(module.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/40 text-slate-300 rounded-lg text-xs font-medium w-fit border border-white/5 transition-colors"
                    >
                      <Settings2 size={14} /> НАСТРОЙКИ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'automod' && <AutomodSettings serverData={serverData} />}
          {activeTab === 'welcome' && <WelcomeSettings serverData={serverData} />}
          {activeTab === 'reaction_roles' && <ReactionRolesSettings serverData={serverData} />}
          {activeTab === 'custom_commands' && <CustomCommandsSettings />}
          {activeTab === 'action_log' && <ActionLogSettings serverData={serverData} />}
          
          {activeTab === 'settings' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Settings className="text-indigo-400" />
                    Глобальные настройки
                  </h2>
                  <p className="text-slate-400">Основные параметры работы бота на сервере.</p>
                </div>
              </div>
            </div>
          )}

          {isGenericModule && genericModuleData && (
             <GenericModuleSettings 
               moduleData={genericModuleData} 
               config={moduleSettingsConfig[genericModuleData.id] || []}
               serverData={serverData}
               onBack={() => setActiveTab('modules')} 
             />
          )}

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
