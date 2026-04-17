import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export const SocietyContext = createContext({ societies: [], loading: true })

export function SocietyProvider({ children }) {
  const [societies, setSocieties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase.from('societies').select('*').order('name').then(({ data, error }) => {
      if (cancelled) return
      if (!error && data) setSocieties(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <SocietyContext.Provider value={{ societies, loading }}>
      {children}
    </SocietyContext.Provider>
  )
}

export function useSocieties() {
  return useContext(SocietyContext)
}
