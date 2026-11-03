import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, Bot, ChevronRight, CircleHelp, Command,
  Filter, LogOut, MessageSquare, Plus, RefreshCw, Search, Server, Shield,
  ShieldCheck, SlidersHorizontal, Users,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      mode: "cors",
      credentials: "include",
      headers,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(
      `Не удалось связаться с API (${API_BASE || window.location.origin}). Проверь, что сервер запущен и доступен. Подробности браузера: ${details}`,
    );
  }
}

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};
type Guild = {
  id: string;
  name: string;
  icon?: string | null;
};
type GuildSettings = {
  modules: Record<string, boolean>;
  automod: { antiSpam: boolean; antiInvite: boolean; antiCaps: boolean; badWords: string[]; spamLimit: number; spamWindowMs: number; timeoutMs: number };
  levels: { xpPerMessage: number; cooldownSeconds: number; xpMultiplier: number; levelUpMessage: string };
  welcome: { enabled: boolean; channelId?: string; message?: string };
  leave: { enabled: boolean; channelId?: string; message?: string };
  customCommands: Record<string, string>;
  announcementChannelId: string;
};
type ModuleItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: typeof Shield;
  commands: string;
  status: "available";
};

const modules: ModuleItem[] = [
  { id: "moderation", name: "Модерация", description: "Баны, кики, муты, предупреждения и очистка сообщений.", commands: "Команды: /ban, /kick, /mute, /warn, /warnings, /clear.", category: "Безопасность", icon: Shield, status: "available" },
  { id: "automod", name: "Автомодерация", description: "Антиспам, блокировка Discord-приглашений, капса и запрещённых слов.", commands: "Включи нужные фильтры и список слов командой /automod.", category: "Безопасность", icon: Filter, status: "available" },
  { id: "welcome", name: "Приветствия", description: "Сообщения при входе и выходе участников.", commands: "Выбери канал и текст командой /greetings.", category: "Сообщество", icon: Users, status: "available" },
  { id: "levels", name: "Уровни", description: "Опыт за сообщения, уровни и таблица лидеров.", commands: "Проверка: /rank. Таблица: /leaderboard.", category: "Сообщество", icon: Activity, status: "available" },
  { id: "custom-commands", name: "Пользовательские команды", description: "Собственные текстовые ответы бота на команды с префиксом !.", commands: "Создание и управление: /customcommand.", category: "Инструменты", icon: Command, status: "available" },
  { id: "announcements", name: "Оповещения", description: "Публикация новостей в выбранный канал сервера.", commands: "Публикация: /news.", category: "Инструменты", icon: MessageSquare, status: "available" },
];

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "??";
}

export default function App() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleItem | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [moduleEnabled, setModuleEnabled] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [savingModule, setSavingModule] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const userResponse = await apiFetch("/api/user");
      if (!userResponse.ok) {
        setUser(null);
        setGuilds([]);
        setSelectedGuild(null);
        if (userResponse.status !== 401) {
          throw new Error(`API вернул HTTP ${userResponse.status} при проверке сессии.`);
        }
        return;
      }
      const userData = await userResponse.json() as DiscordUser;
      setUser(userData);
      const guildResponse = await apiFetch("/api/guilds");
      if (!guildResponse.ok) {
        if (guildResponse.status === 401) {
          setUser(null);
          setGuilds([]);
          setSelectedGuild(null);
          return;
        }
        throw new Error(`Не удалось загрузить список серверов Discord (HTTP ${guildResponse.status}).`);
      }
      const guildData = await guildResponse.json() as Guild[];
      setGuilds(guildData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(API_BASE || window.location.origin, window.location.origin).origin || !event.source || event.source === window) return;
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") void loadSession();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadSession]);

  const login = async () => {
    // Open synchronously from the click so the browser does not block the OAuth popup.
    const popup = window.open("about:blank", "eac-discord-login", "width=560,height=720");
    if (!popup) {
      setError("Разреши всплывающие окна для этого сайта и повтори вход.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/auth/url");
      if (!response.ok) {
        const details = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(details.error || `Сервер авторизации вернул HTTP ${response.status}.`);
      }
      const data = await response.json() as { url: string };
      popup.location.href = data.url;
    } catch (e) {
      popup.close();
      setError(e instanceof Error ? e.message : "Ошибка авторизации.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось завершить сеанс на сервере.");
    }
    setUser(null);
    setGuilds([]);
    setSelectedGuild(null);
    setActiveModule(null);
  };

  const loadGuildSettings = useCallback(async (guildId: string) => {
    setError("");
    try {
      const response = await apiFetch(`/api/guilds/${encodeURIComponent(guildId)}/settings`);
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          setSelectedGuild(null);
          setActiveModule(null);
          return;
        }
        throw new Error(response.status === 503
          ? "Не удалось получить настройки панели."
          : `Не удалось загрузить настройки сервера (HTTP ${response.status}).`);
      }
      const data = await response.json() as GuildSettings;
      setSettings(data);
      setModuleEnabled(data.modules || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки настроек.");
    }
  }, []);

  const toggleModule = async (moduleId: string, enabled: boolean) => {
    if (!selectedGuild || savingModule) return;
    const previous = moduleEnabled[moduleId] !== false;
    setModuleEnabled((current) => ({ ...current, [moduleId]: enabled }));
    setSavingModule(true);
    setError("");
    try {
      const response = await apiFetch(`/api/guilds/${encodeURIComponent(selectedGuild.id)}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: { [moduleId]: enabled } }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        if (response.status === 401) {
          setUser(null);
          setGuilds([]);
          setSelectedGuild(null);
          setActiveModule(null);
        }
        throw new Error(data.error || `Не удалось сохранить настройку (HTTP ${response.status}).`);
      }
      const data = await response.json() as { modules?: Record<string, boolean> };
      setModuleEnabled(data.modules || {});
    } catch (e) {
      setModuleEnabled((current) => ({ ...current, [moduleId]: previous }));
      setError(e instanceof Error ? e.message : "Ошибка сохранения.");
    } finally {
      setSavingModule(false);
    }
  };

  const saveSettings = async (patch: Partial<GuildSettings>) => {
    if (!selectedGuild || !settings || savingModule) return;
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSavingModule(true);
    setError("");
    try {
      const response = await apiFetch(`/api/guilds/${encodeURIComponent(selectedGuild.id)}/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `Не удалось сохранить настройки (HTTP ${response.status}).`);
      }
      const data = await response.json() as GuildSettings;
      setSettings(data); setModuleEnabled(data.modules || {});
    } catch (e) {
      setSettings(previous);
      setError(e instanceof Error ? e.message : "Ошибка сохранения настроек.");
    } finally { setSavingModule(false); }
  };

  const filteredModules = useMemo(
    () => modules.filter((item) => (item.name + " " + item.description + " " + item.category).toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  if (loading) {
    return <div className="screen-center"><div className="loader" /><span>Подключаем EAC Helper…</span></div>;
  }

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-glow login-glow-one" /><div className="login-glow login-glow-two" />
        <div className="login-card">
          <div className="brand-mark"><Bot size={34} strokeWidth={1.8} /></div>
          <div className="eyebrow">DISCORD MANAGEMENT</div>
          <h1>[EAC]-Helper</h1>
          <p className="muted login-copy">Управление Discord-сервером и инструментами модерации в одном месте.</p>
          <button className="button button-discord button-wide" onClick={login} disabled={busy}>
            <MessageSquare size={19} /> {busy ? "Подключение…" : "Продолжить через Discord"}
          </button>
          {error && <div className="notice notice-error">{error}</div>}
          <div className="login-foot"><ShieldCheck size={15} /> Авторизация защищена Discord OAuth2</div>
        </div>
      </div>
    );
  }

  if (!selectedGuild) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand"><span className="brand-mini"><Bot size={19} /></span><b>[EAC]-Helper</b></div>
          <div className="topbar-user">
            <img className="avatar" src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} alt="" />
            <span>{user.global_name || user.username}</span>
            <button className="icon-button" onClick={logout} title="Выйти"><LogOut size={17} /></button>
          </div>
        </header>
        <main className="server-page">
          <div className="page-kicker">ПАНЕЛЬ УПРАВЛЕНИЯ</div>
          <h1>Выбери сервер</h1>
          <p className="muted">Показываем серверы, где у твоего аккаунта есть право управления.</p>
          {error && <div className="notice notice-error">{error}</div>}
          <div className="server-toolbar">
            <span>{guilds.length} сервер(а)</span>
            <button className="button button-ghost button-small" onClick={() => void loadSession()}><RefreshCw size={15} /> Обновить</button>
          </div>
          {guilds.length ? (
            <div className="server-grid">
              {guilds.map((guild) => (
                <button className="server-card" key={guild.id} onClick={() => { setSelectedGuild(guild); setActiveModule(null); void loadGuildSettings(guild.id); }}>
                  {guild.icon ? <img className="server-icon" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`} alt="" /> : <span className="server-icon server-fallback">{initials(guild.name)}</span>}
                  <span className="server-info"><b>{guild.name}</b><small>Открыть панель управления</small></span>
                  <ChevronRight size={19} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Server size={30} /><b>Серверы не найдены</b><span>Нужны права «Администратор» или «Управление сервером» в Discord.</span></div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mini"><Bot size={19} /></span><b>[EAC]-Helper</b><span className="brand-divider">/</span><button className="guild-switch" onClick={() => { setSelectedGuild(null); setActiveModule(null); }}>{selectedGuild.name}<ChevronRight size={15} /></button></div>
        <div className="topbar-user"><span className="online-dot" /> Панель активна <img className="avatar" src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : ""} alt="" /><button className="icon-button" onClick={logout} title="Выйти"><LogOut size={17} /></button></div>
      </header>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-label">СЕРВЕР</div>
          <div className="sidebar-guild"><span className="guild-avatar">{initials(selectedGuild.name)}</span><span>{selectedGuild.name}</span></div>
          <div className="sidebar-label sidebar-section-label">УПРАВЛЕНИЕ</div>
          <button className={`nav-item ${!activeModule ? "nav-active" : ""}`} onClick={() => setActiveModule(null)}><SlidersHorizontal size={17} /> Обзор модулей</button>
          <div className="sidebar-bottom"><CircleHelp size={16} /> EAC Helper · Панель управления</div>
        </aside>
        <main className="dashboard-main">
          {activeModule ? (
            <>
              <button className="back-link" onClick={() => setActiveModule(null)}><ArrowLeft size={16} /> Все модули</button>
              <div className="module-heading"><span className="module-icon"><activeModule.icon size={23} /></span><div><div className="page-kicker">{activeModule.category}</div><h1>{activeModule.name}</h1></div></div>
              <section className="work-panel">
                <div className="work-panel-icon"><Activity size={24} /></div><h2>Настройки модуля</h2><p>{activeModule.description}</p>
                <div className="module-setting-row"><div><b>{activeModule.name}</b><small>{moduleEnabled[activeModule.id] === false ? "Модуль выключен" : "Модуль включён"}</small></div><button className={`toggle ${moduleEnabled[activeModule.id] !== false ? "toggle-on" : ""}`} role="switch" aria-checked={moduleEnabled[activeModule.id] !== false} disabled={savingModule} onClick={() => void toggleModule(activeModule.id, moduleEnabled[activeModule.id] === false)}><span /></button></div>
                {!settings ? <p>Загружаем параметры…</p> : <>
                  {activeModule.id === "automod" && <div className="settings-form">
                    {([["antiSpam","Антиспам"],["antiInvite","Блокировать Discord-приглашения"],["antiCaps","Фильтр капса"]] as const).map(([key,label]) => <label className="module-setting-row" key={key}><span>{label}</span><input type="checkbox" checked={settings.automod[key]} onChange={e => void saveSettings({ automod: { ...settings.automod, [key]: e.target.checked } })} /></label>)}
                    <label>Сообщений для срабатывания<input type="number" min="2" max="20" value={settings.automod.spamLimit} onChange={e => setSettings(s => s ? {...s,automod:{...s.automod,spamLimit:Number(e.target.value)}} : s)} onBlur={() => void saveSettings({automod:settings.automod})}/></label>
                    <label>Окно антиспама (мс)<input type="number" min="1000" max="30000" value={settings.automod.spamWindowMs} onChange={e => setSettings(s => s ? {...s,automod:{...s.automod,spamWindowMs:Number(e.target.value)}} : s)} onBlur={() => void saveSettings({automod:settings.automod})}/></label>
                    <label>Тайм-аут за спам (мс)<input type="number" min="0" max="2419200000" value={settings.automod.timeoutMs} onChange={e => setSettings(s => s ? {...s,automod:{...s.automod,timeoutMs:Number(e.target.value)}} : s)} onBlur={() => void saveSettings({automod:settings.automod})}/></label>
                    <label>Запрещённые слова, через запятую<textarea value={settings.automod.badWords.join(", ")} onChange={e => setSettings(s => s ? {...s,automod:{...s.automod,badWords:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)}} : s)} onBlur={() => void saveSettings({automod:settings.automod})}/></label>
                  </div>}
                  {activeModule.id === "levels" && <div className="settings-form">
                    <label>XP за сообщение<input type="number" min="1" max="1000" value={settings.levels.xpPerMessage} onChange={e=>setSettings(s=>s?{...s,levels:{...s.levels,xpPerMessage:Number(e.target.value)}}:s)} onBlur={()=>void saveSettings({levels:settings.levels})}/></label>
                    <label>Кулдаун начисления (секунды)<input type="number" min="5" max="3600" value={settings.levels.cooldownSeconds} onChange={e=>setSettings(s=>s?{...s,levels:{...s.levels,cooldownSeconds:Number(e.target.value)}}:s)} onBlur={()=>void saveSettings({levels:settings.levels})}/></label>
                    <label>Сложность уровня (множитель)<input type="number" min="10" max="10000" value={settings.levels.xpMultiplier} onChange={e=>setSettings(s=>s?{...s,levels:{...s.levels,xpMultiplier:Number(e.target.value)}}:s)} onBlur={()=>void saveSettings({levels:settings.levels})}/></label>
                    <label>Сообщение при повышении уровня<textarea value={settings.levels.levelUpMessage} onChange={e=>setSettings(s=>s?{...s,levels:{...s.levels,levelUpMessage:e.target.value}}:s)} onBlur={()=>void saveSettings({levels:settings.levels})}/></label>
                    <small>Переменные: {"{user}"} и {"{level}"}.</small>
                  </div>}
                  {activeModule.id === "welcome" && <div className="settings-form">
                    {(["welcome","leave"] as const).map(key=><div key={key}><h3>{key==="welcome"?"Приветствие нового участника":"Сообщение при выходе"}</h3>
                      <label className="module-setting-row"><span>Включено</span><input type="checkbox" checked={settings[key].enabled} onChange={e=>void saveSettings({[key]:{...settings[key],enabled:e.target.checked}} as Partial<GuildSettings>)}/></label>
                      <label>ID текстового канала<input value={settings[key].channelId||""} placeholder="ID канала Discord" onChange={e=>setSettings(s=>s?{...s,[key]:{...s[key],channelId:e.target.value}}:s)} onBlur={()=>void saveSettings({[key]:settings[key]} as Partial<GuildSettings>)}/></label>
                      <label>Текст сообщения<textarea value={settings[key].message||""} onChange={e=>setSettings(s=>s?{...s,[key]:{...s[key],message:e.target.value}}:s)} onBlur={()=>void saveSettings({[key]:settings[key]} as Partial<GuildSettings>)}/></label>
                    </div>)}
                    <small>Переменные: {"{user}"}, {"{server}"}, {"{membercount}"}.</small>
                  </div>}
                  {activeModule.id === "custom-commands" && <div className="settings-form">
                    <label>Пользовательские команды (одна на строку: имя=ответ)<textarea rows={8} value={Object.entries(settings.customCommands).map(([k,v])=>k+"="+v).join("\n")} onChange={e=>{const obj:Record<string,string>={};for(const line of e.target.value.split("\n")){const i=line.indexOf("=");if(i>0)obj[line.slice(0,i).trim().toLowerCase()]=line.slice(i+1).trim();}setSettings(s=>s?{...s,customCommands:obj}:s);}} onBlur={()=>void saveSettings({customCommands:settings.customCommands})}/></label>
                    <small>Вызов в Discord: !имя. Максимум 100 команд, имя — латиница/цифры/_/-.</small>
                  </div>}
                  {activeModule.id === "announcements" && <div className="settings-form">
                    <label>Канал оповещений по умолчанию (ID)<input value={settings.announcementChannelId} onChange={e=>setSettings(s=>s?{...s,announcementChannelId:e.target.value}:s)} onBlur={()=>void saveSettings({announcementChannelId:settings.announcementChannelId})}/></label>
                    <small>Команда /news пока позволяет выбрать канал вручную.</small>
                  </div>}
                  {activeModule.id === "moderation" && <div className="settings-form"><p>Команды: /ban, /kick, /mute, /warn, /warnings, /clear.</p><p>Права доступа проверяются Discord для каждой команды. Предупреждения хранятся в памяти и сбрасываются при перезапуске.</p></div>}
                </>}
                {savingModule && <small className="save-state">Сохранение…</small>}{error && <div className="notice notice-error">{error}</div>}<span className="status-pill">Конфигурация хранится в памяти до перезапуска процесса.</span>
              </section>
            </>
          ) : (
            <>
              <div className="dashboard-heading"><div><div className="page-kicker">УПРАВЛЕНИЕ СЕРВЕРОМ</div><h1>Модули</h1><p className="muted">Выбери инструмент, чтобы открыть его настройки.</p></div><div className="server-badge"><ShieldCheck size={16} /> {selectedGuild.name}</div></div>
              <div className="module-toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Найти модуль…" /><kbd>⌘ K</kbd></div><span className="module-count">{filteredModules.length} модулей</span></div>
              <div className="module-grid">
                {filteredModules.map((item) => {
                  const Icon = item.icon;
                  return <button className="module-card" key={item.id} onClick={() => setActiveModule(item)}>
                    <div className="module-card-top"><span className="module-icon"><Icon size={21} /></span><span className="status-pill">{moduleEnabled[item.id] === false ? "Выключен" : "Включён"}</span></div>
                    <b>{item.name}</b><p>{item.description}</p><span className="module-open">Открыть <ChevronRight size={15} /></span>
                  </button>;
                })}
              </div>
              <div className="foundation-note"><Plus size={16} /><span><b>Настройки хранятся только в оперативной памяти.</b> После перезапуска процесса все модули снова включаются по умолчанию.</span></div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
