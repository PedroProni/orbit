export type PaletteGroup = 'lists' | 'tasks' | 'docs' | 'pages' | 'actions';

export interface PaletteItem {
  key: string;
  group: PaletteGroup;
  label: string;
  hint?: string;
  run: () => void;
}

export interface CommandPaletteProps {
  open?: boolean;
}
