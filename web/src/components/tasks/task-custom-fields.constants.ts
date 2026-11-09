import { CalendarDays, CircleChevronDown, Link, LucideIcon, Square } from 'lucide-react';
import { CustomFieldType } from '@/types/api.types';

export const CUSTOM_FIELD_URL_PATTERN = /^https?:\/\/\S+$/;
export const CUSTOM_FIELDS_HIDE_EMPTY_ABOVE = 6;
export const CUSTOM_FIELD_TYPE_ICONS: Partial<Record<CustomFieldType, LucideIcon>> = { dropdown: CircleChevronDown, date: CalendarDays, url: Link };
export const CUSTOM_FIELD_FALLBACK_ICON: LucideIcon = Square;
