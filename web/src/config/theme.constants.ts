export const THEME_STORAGE_KEY = 'theme';
export const DARK_CLASS = 'dark';
export const LIGHT_THEME = 'light';
export const DARK_THEME = 'dark';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='${LIGHT_THEME}')document.documentElement.classList.remove('${DARK_CLASS}')}catch(e){}`;
