import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useProfile } from './useProfile.js'

/** List active hiring posts, across both societies (newest first). */
export function useHiringListings(category = 'all', kind = 'all') {
  return useQuery({
    queryKey: ['hiring', category, kind],
    queryFn: async () => {
      let q = supabase
        .from('hiring_listings')
        .select('*, poster:profiles!hiring_listings_posted_by_fkey(id, full_name), society:societies(id, name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (category !== 'all') q = q.eq('category', category)
      if (kind !== 'all')     q = q.eq('kind', kind)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000
  })
}

export function useCreateHiring() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('hiring_listings')
        .insert({
          ...payload,
          posted_by: user.id,
          society_id: profile.society_id
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hiring'] })
  })
}

export function useDeleteHiring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('hiring_listings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hiring'] })
  })
}
