import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useProfile } from './useProfile.js'

export function usePolls() {
  const { profile } = useProfile()
  return useQuery({
    queryKey: ['polls'],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*, options:poll_options(*), society:societies(id, name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })
}

export function usePoll(id) {
  return useQuery({
    queryKey: ['poll', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('*, options:poll_options(*), society:societies(id, name), creator:profiles!polls_created_by_fkey(id, full_name)')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    }
  })
}

export function useMyVote(pollId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['poll-vote', pollId, user?.id],
    enabled: !!pollId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('resident_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    }
  })
}

export function useCastVote(pollId) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (optionId) => {
      const { error } = await supabase
        .from('poll_votes')
        .insert({ poll_id: pollId, option_id: optionId, resident_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['poll', pollId] })
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['poll-vote', pollId] })
    }
  })
}

export function useCreatePoll() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ question, options, closes_at }) => {
      const { data: poll, error } = await supabase
        .from('polls')
        .insert({
          society_id: profile.society_id,
          created_by: user.id,
          question,
          closes_at
        })
        .select()
        .single()
      if (error) throw error
      const rows = options.filter(Boolean).map((o) => ({ poll_id: poll.id, option_text: o }))
      if (rows.length) {
        const { error: e2 } = await supabase.from('poll_options').insert(rows)
        if (e2) throw e2
      }
      return poll
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] })
  })
}
