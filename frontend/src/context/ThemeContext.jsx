import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('predictiq_theme') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('predictiq_theme', theme)
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light-theme')
      document.body.classList.add('light-theme')
    } else {
      root.classList.remove('light-theme')
      document.body.classList.remove('light-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
