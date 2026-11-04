export type GuardedModule = 'moderation' | 'announcements' | 'levels';

export function isModuleEnabled(modules: Record<string, boolean>, moduleId: GuardedModule): boolean {
  return modules[moduleId] !== false;
}
