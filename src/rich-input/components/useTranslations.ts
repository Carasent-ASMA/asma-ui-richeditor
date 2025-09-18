import { useMemo } from 'react'
import type { ILocale } from '../interfaces/types'

const translations = {
    en: {
        emojis: 'Emojis',
        heading1: 'Heading 1',
        heading2: 'Heading 2',
        bold: 'Bold',
        italic: 'Italic',
        link: 'Link',
        more: 'More',
        close: 'Close',
        ordered_list: 'Ordered list',
        bullet_list: 'Bullet list',
        font_size: 'Font size',
    },
    no: {
        emojis: 'Emojier',
        heading1: 'Overskrift 1',
        heading2: 'Overskrift 2',
        bold: 'Fet',
        italic: 'Kursiv',
        link: 'Lenke',
        more: 'Mer',
        close: 'Lukk',
        ordered_list: 'Nummerert liste',
        bullet_list: 'Punktliste',
        font_size: 'Skriftstørrelse',
    },
}

export function useTranslations(locale: ILocale = 'en') {
    return useMemo(() => translations[locale] ?? translations.en, [locale])
}
