import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Enforce pure light mode across the entire application
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.removeItem('w2r_theme')
    localStorage.setItem('resourcex_theme', 'light')
  }, [])

  const theme = 'light'
  const isDark = false
  const toggleTheme = () => {
    // Light mode only - dark mode removed per enterprise specification
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return { theme: 'light', isDark: false, toggleTheme: () => {} }
  }
  return ctx
}

export default ThemeContext
