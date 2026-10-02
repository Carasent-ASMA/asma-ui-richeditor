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
        empty_selection_link: 'Select text first to add a link',
        show_formatting: 'Show formatting options',
        hide_formatting: 'Hide formatting options',
        upload_image: 'Upload image',
        rich_text_editor: 'Rich text editor',
        add_link: 'Add link',
        cancel: 'Cancel',
        link_url: 'Link URL',
        small: 'Small',
        normal: 'Normal',
        large: 'Large',
        huge: 'Huge',
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
        empty_selection_link: 'Velg tekst først for å legge til en lenke',
        show_formatting: 'Vis formateringsalternativer',
        hide_formatting: 'Skjul formateringsalternativer',
        upload_image: 'Last opp bilde',
        rich_text_editor: 'Riktekstredigering',
        add_link: 'Legg til lenke',
        cancel: 'Avbryt',
        link_url: 'Lenkeadresse',
        small: 'Liten',
        normal: 'Normal',
        large: 'Stor',
        huge: 'Enorm',
    },
}

export function useTranslations(locale: ILocale = 'en') {
    return useMemo(() => translations[locale] ?? translations.en, [locale])
}
