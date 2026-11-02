import "dotenv/config";
import { startBot } from "./index";

async function main() {
  if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "YOUR_DISCORD_BOT_TOKEN") {
    console.error("[EAC Helper] Не задан DISCORD_TOKEN. Заполни файл .env и запусти бота снова.");
    process.exit(1);
  }

  console.log("[EAC Helper] Запуск Discord-бота...");
  await startBot();
}

main().catch((error) => {
  console.error("[EAC Helper] Критическая ошибка запуска:", error);
  process.exit(1);
});
