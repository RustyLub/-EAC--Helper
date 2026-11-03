import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, Bot, ChevronRight, CircleHelp, Command, FileText,
  Filter, LogOut, MessageSquare, Plus, RefreshCw, Search, Server, Shield,
  ShieldCheck, SlidersHorizontal, Ticket, Users, X,
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
      if (!guildResponse.ok) throw new Error(`Не удалось загрузить список серверов Discord (HTTP ${guildResponse.status}).`);
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
      if (!response.ok) throw new Error(response.status === 503
        ? "Не удалось получить настройки панели."
        : `Не удалось загрузить настройки сервера (HTTP ${response.status}).`);
      const data = await response.json() as { modules?: Record<string, boolean> };
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
              <section className="work-panel"><div className="work-panel-icon"><Activity size={24} /></div><h2>Настройки модуля</h2><p>{activeModule.description}</p><p>{activeModule.commands}</p><div className="module-setting-row"><div><b>{activeModule.name}</b><small>{moduleEnabled[activeModule.id] === false ? "Модуль выключен" : "Модуль включён"}</small></div><button className={`toggle ${moduleEnabled[activeModule.id] !== false ? "toggle-on" : ""}`} role="switch" aria-checked={moduleEnabled[activeModule.id] !== false} disabled={savingModule} onClick={() => void toggleModule(activeModule.id, moduleEnabled[activeModule.id] === false)}><span /></button></div>{savingModule && <small className="save-state">Сохранение…</small>}{error && <div className="notice notice-error">{error}</div>}<span className="status-pill">Настройка действует до перезапуска</span></section>
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
