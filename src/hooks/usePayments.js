import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'

export function usePayments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['payments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('resident_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })
}

export function useMarkPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payment_ref }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString(), payment_ref })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] })
  })
}
