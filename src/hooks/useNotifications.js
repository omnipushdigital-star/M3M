import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'

export function useNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('resident_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data ?? []
    }
  })

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `resident_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ['notifications', user.id] })
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, qc])

  return query
}

export function useMarkAllRead() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('resident_id', user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] })
  })
}
