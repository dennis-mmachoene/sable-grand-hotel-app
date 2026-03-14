import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark'

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      initTheme: () => {
        const stored = get().theme;
        // Respect OS preference if no stored value
        const preferred = stored || (
          window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        );
        set({ theme: preferred });
        applyTheme(preferred);
      },
    }),
    {
      name: 'hotelflow-theme',
    }
  )
);

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export default useThemeStore;
