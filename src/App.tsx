import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type ChannelOption = { id: string; name: string };

/** Загружает настройки без побочных эффектов на интерфейс (для отката после ошибки сохранения). */
async function loadSettingsQuiet(guildId: string): Promise<GuildSettings | null> {
  try {
    const response = await apiFetch(`/api/guilds/${encodeURIComponent(guildId)}/settings`);
    return response.ok ? (await response.json() as GuildSettings) : null;
  } catch {
    return null;
  }
}

/** Разбирает текст «имя=ответ» (по одной команде на строку): возвращает команды либо текст ошибки. */
function parseCustomCommands(text: string): { commands: Record<string, string> } | { error: string } {
  const commands: Record<string, string> = {};
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    const separator = line.indexOf("=");
    const name = separator > 0 ? line.slice(0, separator).trim().toLowerCase() : "";
    const response = separator > 0 ? line.slice(separator + 1).trim() : "";
    if (!name || !response) return { error: `Строка ${index + 1}: нужен формат «имя=ответ».` };
    if (!/^[a-z0-9_-]{1,32}$/.test(name) || name === "__proto__") {
      return { error: `Строка ${index + 1}: имя «${name}» — только латиница, цифры, _ и -, до 32 символов.` };
    }
    commands[name] = response;
  }
  if (Object.keys(commands).length > 100) return { error: "Максимум 100 команд." };
  return { commands };
}

// Поля ниже хранят набираемый текст локально и отправляют его на сервер только при потере фокуса.
// Раньше значение пересобиралось из настроек на каждое нажатие клавиши, поэтому в списке слов
// стиралась запятая, а в списке команд — строка без «=», и набрать новое значение было нельзя.
function DraftTextarea({ value, onCommit, rows, placeholder }: { value: string; onCommit: (text: string) => void; rows?: number; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <textarea rows={rows} placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => { if (draft !== value) onCommit(draft); }} />;
}

function DraftInput({ value, onCommit, placeholder }: { value: string; onCommit: (text: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <input value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={() => { if (draft.trim() !== value) onCommit(draft.trim()); }} />;
}

function NumberField({ value, min, max, onCommit }: { value: number; min: number; max: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const parsed = Math.round(Number(draft));
    if (draft.trim() === "" || !Number.isFinite(parsed)) { setDraft(String(value)); return; }
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };
  return <input type="number" min={min} max={max} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />;
}

/** Выпадающий список каналов; если список недоступен (бота нет на сервере) — ручной ввод ID. */
function ChannelPicker({ label, value, channels, onCommit }: { label: string; value: string; channels: ChannelOption[] | null; onCommit: (id: string) => void }) {
  if (channels && channels.length > 0) {
    const known = channels.some((channel) => channel.id === value);
    return (
      <label>{label}
        <select value={value} onChange={(e) => onCommit(e.target.value)}>
          <option value="">— не выбран —</option>
          {!known && value && <option value={value}>Канал {value}</option>}
          {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
        </select>
      </label>
    );
  }
  return <label>{label} (ID канала; список недоступен — бот не на сервере или нет прав)<DraftInput value={value} placeholder="ID канала Discord" onCommit={onCommit} /></label>;
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
  const [channels, setChannels] = useState<ChannelOption[] | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const channelsGuildId = useRef("");

  const loadChannels = useCallback(async (guildId: string) => {
    channelsGuildId.current = guildId;
    setChannels(null);
    try {
      const response = await apiFetch(`/api/guilds/${encodeURIComponent(guildId)}/channels`);
      if (!response.ok) return; // бота нет на сервере или нет доступа — остаётся ручной ввод ID
      const data = await response.json() as Array<{ id: string; name: string; type: number; position?: number }>;
      if (channelsGuildId.current !== guildId) return; // за время запроса выбрали другой сервер
      setChannels(
        data
          .filter((channel) => channel.type === 0 || channel.type === 5) // текстовые и новостные
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map(({ id, name }) => ({ id, name })),
      );
    } catch {
      // Ручной ввод ID остаётся доступным.
    }
  }, []);

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

  // Сохранения идут строго по очереди. Раньше параллельный запрос молча отбрасывался
  // (например, клик по переключателю сразу после ввода текста терял одну из настроек).
  const saveSettings = (patch: Partial<GuildSettings>): Promise<void> => {
    const guild = selectedGuild;
    if (!guild) return Promise.resolve();
    setSettings((current) => current ? { ...current, ...patch, modules: { ...current.modules, ...patch.modules } } : current);
    if (patch.modules) setModuleEnabled((current) => ({ ...current, ...patch.modules }));

    const run = async () => {
      setSavingModule(true);
      setError("");
      try {
        const response = await apiFetch(`/api/guilds/${encodeURIComponent(guild.id)}/settings`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string };
          if (response.status === 401) {
            setUser(null);
            setGuilds([]);
            setSelectedGuild(null);
            setActiveModule(null);
          }
          throw new Error(data.error || `Не удалось сохранить настройки (HTTP ${response.status}).`);
        }
        const data = await response.json() as GuildSettings;
        setSettings(data);
        setModuleEnabled(data.modules || {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка сохранения настроек.");
        // Показываем фактическое состояние сервера вместо отклонённых правок.
        const fresh = await loadSettingsQuiet(guild.id);
        if (fresh) {
          setSettings(fresh);
          setModuleEnabled(fresh.modules || {});
        }
      } finally {
        setSavingModule(false);
      }
    };
    saveQueue.current = saveQueue.current.then(run);
    return saveQueue.current;
  };

  const toggleModule = (moduleId: string, enabled: boolean) => saveSettings({ modules: { [moduleId]: enabled } });

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
                <button className="server-card" key={guild.id} onClick={() => {
                  // Сбрасываем данные прошлого сервера, чтобы случайно не сохранить их в новый.
                  setSettings(null);
                  setModuleEnabled({});
                  setSelectedGuild(guild);
                  setActiveModule(null);
                  void loadGuildSettings(guild.id);
                  void loadChannels(guild.id);
                }}>
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
                    {([["antiSpam", "Антиспам"], ["antiInvite", "Блокировать Discord-приглашения"], ["antiCaps", "Фильтр капса"]] as const).map(([key, label]) => (
                      <label className="module-setting-row" key={key}><span>{label}</span><input type="checkbox" checked={settings.automod[key]} onChange={(e) => void saveSettings({ automod: { ...settings.automod, [key]: e.target.checked } })} /></label>
                    ))}
                    <label>Сообщений для срабатывания (2–20)<NumberField value={settings.automod.spamLimit} min={2} max={20} onCommit={(value) => void saveSettings({ automod: { ...settings.automod, spamLimit: value } })} /></label>
                    <label>Окно антиспама, мс (1000–30000)<NumberField value={settings.automod.spamWindowMs} min={1000} max={30000} onCommit={(value) => void saveSettings({ automod: { ...settings.automod, spamWindowMs: value } })} /></label>
                    <label>Тайм-аут за спам, мс (0 — без тайм-аута)<NumberField value={settings.automod.timeoutMs} min={0} max={2419200000} onCommit={(value) => void saveSettings({ automod: { ...settings.automod, timeoutMs: value } })} /></label>
                    <label>Запрещённые слова — через запятую или с новой строки
                      <DraftTextarea value={settings.automod.badWords.join(", ")} onCommit={(text) => void saveSettings({ automod: { ...settings.automod, badWords: text.split(/[,\n]/).map((word) => word.trim()).filter(Boolean) } })} />
                    </label>
                  </div>}
                  {activeModule.id === "levels" && <div className="settings-form">
                    <label>XP за сообщение (1–1000)<NumberField value={settings.levels.xpPerMessage} min={1} max={1000} onCommit={(value) => void saveSettings({ levels: { ...settings.levels, xpPerMessage: value } })} /></label>
                    <label>Кулдаун начисления, секунды (5–3600)<NumberField value={settings.levels.cooldownSeconds} min={5} max={3600} onCommit={(value) => void saveSettings({ levels: { ...settings.levels, cooldownSeconds: value } })} /></label>
                    <label>Сложность уровня — множитель (10–10000)<NumberField value={settings.levels.xpMultiplier} min={10} max={10000} onCommit={(value) => void saveSettings({ levels: { ...settings.levels, xpMultiplier: value } })} /></label>
                    <label>Сообщение при повышении уровня
                      <DraftTextarea value={settings.levels.levelUpMessage} onCommit={(text) => void saveSettings({ levels: { ...settings.levels, levelUpMessage: text } })} />
                    </label>
                    <small>Переменные: {"{user}"} и {"{level}"}. Уровень = √(XP ÷ множитель), округление вниз.</small>
                  </div>}
                  {activeModule.id === "welcome" && <div className="settings-form">
                    {(["welcome", "leave"] as const).map((key) => (
                      <div key={key}>
                        <h3>{key === "welcome" ? "Приветствие нового участника" : "Сообщение при выходе"}</h3>
                        <label className="module-setting-row"><span>Включено</span><input type="checkbox" checked={settings[key].enabled} onChange={(e) => void saveSettings({ [key]: { ...settings[key], enabled: e.target.checked } } as Partial<GuildSettings>)} /></label>
                        <ChannelPicker label="Канал" value={settings[key].channelId || ""} channels={channels} onCommit={(id) => void saveSettings({ [key]: { ...settings[key], channelId: id } } as Partial<GuildSettings>)} />
                        <label>Текст сообщения
                          <DraftTextarea value={settings[key].message || ""} onCommit={(text) => void saveSettings({ [key]: { ...settings[key], message: text } } as Partial<GuildSettings>)} />
                        </label>
                      </div>
                    ))}
                    <small>Переменные: {"{user}"}, {"{server}"}, {"{membercount}"}. Чтобы сообщение отправлялось, выберите канал.</small>
                  </div>}
                  {activeModule.id === "custom-commands" && <div className="settings-form">
                    <label>Пользовательские команды — по одной на строку в формате имя=ответ
                      <DraftTextarea rows={8} value={Object.entries(settings.customCommands).map(([name, text]) => `${name}=${text}`).join("\n")} onCommit={(text) => {
                        const parsed = parseCustomCommands(text);
                        if ("error" in parsed) { setError(parsed.error); return; }
                        setError("");
                        void saveSettings({ customCommands: parsed.commands });
                      }} />
                    </label>
                    <small>Вызов в Discord: !имя. Максимум 100 команд; имя — латиница, цифры, _ или -.</small>
                  </div>}
                  {activeModule.id === "announcements" && <div className="settings-form">
                    <ChannelPicker label="Канал оповещений по умолчанию" value={settings.announcementChannelId} channels={channels} onCommit={(id) => void saveSettings({ announcementChannelId: id })} />
                    <small>Команда /news использует этот канал, если канал не указан в самой команде.</small>
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
