export const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'pt', label: '🇧🇷 Português' },
  { code: 'hi', label: '🇮🇳 हिन्दी' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'uk', label: '🇺🇦 Українська' },
]

export const LANG_FLAG: Record<string, string> = Object.fromEntries(
  LANGUAGES.map(l => [l.code, l.label.split(' ')[0]])
)