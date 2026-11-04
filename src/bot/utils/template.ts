/**
 * Подставляет значения в {placeholder}-шаблон.
 *
 * Значения вставляются буквально: специальные последовательности вроде `$&` или `$1`
 * (которые интерпретирует String.replace со строковой заменой) в названии сервера или
 * нике участника больше не искажают сообщение. Неизвестные плейсхолдеры остаются как есть.
 */
export function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? values[key] : match,
  );
}
