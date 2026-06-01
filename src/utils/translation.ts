import type { UiLang } from '@/api/directus'

type TranslatableRecord = {
  translations?: Array<{ languages_code?: string; [key: string]: unknown }>
  [key: string]: unknown
}

export function getTranslatedField(
  data: TranslatableRecord | null | undefined,
  field: string,
  currentLang: UiLang,
): string {
  if (!data || !field) return ''

  const baseValue = String(data[field] ?? '')
  const translations = Array.isArray(data.translations) ? data.translations : []
  const langPrefix = currentLang === 'en' ? 'en' : 'zh'
  const langMatched = translations.find((item) =>
    String(item?.languages_code || '').toLowerCase().startsWith(langPrefix),
  )
  const fallbackTranslation = translations.find((item) => item?.[field] !== undefined)
  const translatedValue = String(
    (langMatched?.[field] as string | undefined) ??
      (fallbackTranslation?.[field] as string | undefined) ??
      '',
  )

  if (currentLang === 'zh') {
    return baseValue || translatedValue
  }

  return translatedValue || baseValue
}
