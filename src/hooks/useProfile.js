import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'

async function fetchProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      society:societies(*),
      primary_unit:units!profiles_primary_unit_fk(id, unit_code, floor_number, unit_type, plot_id)
    `)
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export function useProfile() {
  const { user } = useAuth()
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id),
    enabled: !!user?.id,
    staleTime: 60_000
  })

  return {
    profile: data ?? null,
    loading: isLoading,
    refreshing: isFetching,
    refetch
  }
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...payload })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] })
  })
}
