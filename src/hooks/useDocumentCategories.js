import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { DOCUMENT_CATEGORIES as DEFAULTS } from '../lib/constants.js'

/**
 * Reads categories from the `document_categories` table.
 * Falls back to the hard-coded defaults if the table is missing
 * (e.g. migration 002 not yet applied).
 */
export function useDocumentCategories() {
  return useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, value, label, sort_order')
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true })
      if (error) {
        // Table may not exist yet — fall back to defaults
        return DEFAULTS.map((c, i) => ({ id: null, value: c.value, label: c.label, sort_order: (i + 1) * 10 }))
      }
      return data?.length ? data : DEFAULTS.map((c, i) => ({ id: null, value: c.value, label: c.label, sort_order: (i + 1) * 10 }))
    },
    staleTime: 60_000
  })
}

function toSlug(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

export function useCreateDocumentCategory() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ label, value }) => {
      const cleanLabel = (label || '').trim()
      if (!cleanLabel) throw new Error('Label is required')
      const slug = toSlug(value || cleanLabel)
      if (!slug) throw new Error('Could not derive a slug from the label')
      const { data, error } = await supabase
        .from('document_categories')
        .insert({ label: cleanLabel, value: slug, created_by: user?.id, sort_order: 500 })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-categories'] })
  })
}

export function useDeleteDocumentCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('Missing id')
      const { error } = await supabase.from('document_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-categories'] })
  })
}
