import { createContext, useContext, useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  isLoading: true,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  ...props
}: ThemeProviderProps) {
  const queryClient = useQueryClient()
  
  // Fetch user preferences from API
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/user/preferences'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })

  // Mutation to update preferences
  const updatePreferences = useMutation({
    mutationFn: async (newTheme: Theme) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      })
      if (!response.ok) throw new Error('Failed to update preferences')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] })
    }
  })

  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  // Update theme when preferences are loaded
  useEffect(() => {
    if (preferences?.theme) {
      setThemeState(preferences.theme)
    }
  }, [preferences])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    updatePreferences.mutate(newTheme)
  }

  const value = {
    theme,
    setTheme,
    isLoading,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}