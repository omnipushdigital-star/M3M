import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useProfile } from './useProfile.js'

/** List active businesses across both societies (newest first). */
export function useBusinesses(category = 'all') {
  return useQuery({
    queryKey: ['businesses', category],
    queryFn: async () => {
      let q = supabase
        .from('businesses')
        .select('*, owner:profiles!businesses_owner_id_fkey(id, full_name), society:societies(id, name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (category !== 'all') q = q.eq('category', category)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000
  })
}

export function useMyBusinesses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['businesses-mine', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })
}

export function useCreateBusiness() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('businesses')
        .insert({ ...payload, owner_id: user.id, society_id: profile.society_id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['businesses'] })
      qc.invalidateQueries({ queryKey: ['businesses-mine'] })
    }
  })
}

export function useDeleteBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('businesses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['businesses'] })
      qc.invalidateQueries({ queryKey: ['businesses-mine'] })
    }
  })
}
