import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {isDark ? (
        <Sun className="theme-toggle-icon sun-icon" size={18} />
      ) : (
        <Moon className="theme-toggle-icon moon-icon" size={18} />
      )}
    </button>
  );
}
