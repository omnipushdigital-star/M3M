import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useProfile } from './useProfile.js'
import { useAuth } from './useAuth.js'

/** List issues in current society with optional filter */
export function useIssues(filter = 'all') {
  const { profile } = useProfile()
  return useQuery({
    queryKey: ['issues', profile?.society_id, filter],
    enabled: !!profile?.society_id,
    queryFn: async () => {
      let q = supabase
        .from('issues')
        .select(`
          *,
          reporter:profiles!issues_reported_by_fkey(id, full_name),
          unit:units(id, unit_code),
          comment_count:issue_comments(count),
          vote_count:issue_votes(count)
        `)
        .eq('society_id', profile.society_id)
        .order('created_at', { ascending: false })

      if (filter === 'urgent') q = q.eq('priority', 'urgent')
      else if (filter === 'open') q = q.eq('status', 'open')
      else if (filter === 'in_progress') q = q.eq('status', 'in_progress')
      else if (filter === 'resolved') q = q.eq('status', 'resolved')

      const { data, error } = await q
      if (error) throw error
      return (data ?? []).map((i) => ({
        ...i,
        comment_count: i.comment_count?.[0]?.count ?? 0,
        vote_count: i.vote_count?.[0]?.count ?? 0
      }))
    }
  })
}

export function useIssue(id) {
  return useQuery({
    queryKey: ['issue', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          reporter:profiles!issues_reported_by_fkey(id, full_name),
          assignee:profiles!issues_assigned_to_fkey(id, full_name),
          unit:units(id, unit_code),
          vote_count:issue_votes(count)
        `)
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data ? { ...data, vote_count: data.vote_count?.[0]?.count ?? 0 } : null
    }
  })
}

export function useIssueComments(issueId) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['issue-comments', issueId],
    enabled: !!issueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*, author:profiles(id, full_name)')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    }
  })

  // Realtime subscription for live comments
  useEffect(() => {
    if (!issueId) return
    const channel = supabase
      .channel(`issue_comments_${issueId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'issue_comments', filter: `issue_id=eq.${issueId}` },
        () => qc.invalidateQueries({ queryKey: ['issue-comments', issueId] })
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [issueId, qc])

  return query
}

export function useAddComment(issueId) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => {
      const { data, error } = await supabase
        .from('issue_comments')
        .insert({ issue_id: issueId, author_id: user.id, body })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issue-comments', issueId] })
  })
}

export function useCreateIssue() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...payload,
          reported_by: user.id,
          society_id: profile.society_id,
          unit_id: payload.unit_id ?? profile.primary_unit_id
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] })
  })
}

export function useToggleIssueVote(issueId) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (hasVoted) => {
      if (hasVoted) {
        const { error } = await supabase
          .from('issue_votes')
          .delete()
          .eq('issue_id', issueId)
          .eq('resident_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('issue_votes')
          .insert({ issue_id: issueId, resident_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issue', issueId] })
      qc.invalidateQueries({ queryKey: ['issues'] })
      qc.invalidateQueries({ queryKey: ['issue-vote', issueId] })
    }
  })
}

export function useHasVoted(issueId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['issue-vote', issueId, user?.id],
    enabled: !!issueId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_votes')
        .select('id')
        .eq('issue_id', issueId)
        .eq('resident_id', user.id)
        .maybeSingle()
      if (error) throw error
      return !!data
    }
  })
}
