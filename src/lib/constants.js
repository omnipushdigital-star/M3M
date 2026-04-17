export const ISSUE_CATEGORIES = [
  { value: 'electrical',   label: 'Electrical',   color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sanitation',   label: 'Sanitation',   color: 'bg-emerald-100 text-emerald-800' },
  { value: 'parking',      label: 'Parking',      color: 'bg-blue-100 text-blue-800' },
  { value: 'security',     label: 'Security',     color: 'bg-red-100 text-red-800' },
  { value: 'water',        label: 'Water',        color: 'bg-sky-100 text-sky-800' },
  { value: 'common_area',  label: 'Common area',  color: 'bg-purple-100 text-purple-800' },
  { value: 'maintenance',  label: 'Maintenance',  color: 'bg-orange-100 text-orange-800' },
  { value: 'other',        label: 'Other',        color: 'bg-slate-100 text-slate-800' }
]

export const PRIORITY_STYLES = {
  low:     'bg-slate-100 text-slate-700',
  medium:  'bg-blue-100 text-blue-700',
  high:    'bg-orange-100 text-orange-800',
  urgent:  'bg-red-100 text-red-700'
}

export const STATUS_STYLES = {
  open:         'bg-amber-100 text-amber-800',
  in_progress:  'bg-blue-100 text-blue-800',
  resolved:     'bg-emerald-100 text-emerald-800',
  closed:       'bg-slate-200 text-slate-700'
}

export const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed'
}

export const DOCUMENT_CATEGORIES = [
  { value: 'minutes',   label: 'Meeting minutes' },
  { value: 'bylaws',    label: 'Bylaws' },
  { value: 'financial', label: 'Financial reports' },
  { value: 'notice',    label: 'Notices' },
  { value: 'other',     label: 'Other' }
]

export const SPACE_TYPES = [
  { value: 'stilt_parking', label: 'Stilt parking' },
  { value: 'basement',      label: 'Basement' },
  { value: 'rooftop',       label: 'Rooftop' }
]

export const CURRENCY = '₹'

export function formatMonthYear(date = new Date()) {
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}
