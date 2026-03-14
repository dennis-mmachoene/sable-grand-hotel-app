import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
        isDark
          ? 'bg-surface-800 text-gold-400 hover:bg-surface-700 border border-surface-700'
          : 'bg-surface-100 text-surface-600 hover:bg-surface-200 border border-surface-200'
      } ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <span className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        <Sun
          className={`absolute w-4 h-4 transition-all duration-300 ${
            isDark ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
          }`}
        />
        <Moon
          className={`absolute w-4 h-4 transition-all duration-300 ${
            isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
          }`}
        />
      </span>
    </button>
  );
}
