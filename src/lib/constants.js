export const ISSUE_CATEGORIES = [
  { value: 'electrical',     label: 'Electrical',         color: 'bg-yellow-100 text-yellow-800' },
  { value: 'plumbing',       label: 'Plumbing',           color: 'bg-cyan-100 text-cyan-800' },
  { value: 'water',          label: 'Water supply',       color: 'bg-sky-100 text-sky-800' },
  { value: 'sanitation',     label: 'Sanitation',         color: 'bg-emerald-100 text-emerald-800' },
  { value: 'garbage',        label: 'Garbage / Waste',    color: 'bg-lime-100 text-lime-800' },
  { value: 'parking',        label: 'Parking',            color: 'bg-blue-100 text-blue-800' },
  { value: 'security',       label: 'Security',           color: 'bg-red-100 text-red-800' },
  { value: 'lift',           label: 'Lift / Elevator',    color: 'bg-indigo-100 text-indigo-800' },
  { value: 'fire_safety',    label: 'Fire safety',        color: 'bg-rose-100 text-rose-800' },
  { value: 'common_area',    label: 'Common area',        color: 'bg-purple-100 text-purple-800' },
  { value: 'maintenance',    label: 'General maintenance',color: 'bg-orange-100 text-orange-800' },
  { value: 'pest_control',   label: 'Pest control',       color: 'bg-amber-100 text-amber-800' },
  { value: 'landscaping',    label: 'Landscaping / Gardens',color: 'bg-green-100 text-green-800' },
  { value: 'noise',          label: 'Noise complaint',    color: 'bg-fuchsia-100 text-fuchsia-800' },
  { value: 'gas',            label: 'Gas / LPG',          color: 'bg-orange-100 text-orange-700' },
  { value: 'intercom',       label: 'Intercom / Doorbell',color: 'bg-teal-100 text-teal-800' },
  { value: 'neighbour',      label: 'Neighbour dispute',  color: 'bg-pink-100 text-pink-800' },
  { value: 'amenity',        label: 'Amenity / Facility', color: 'bg-violet-100 text-violet-800' },
  { value: 'visitor',        label: 'Visitor / Gate',     color: 'bg-stone-100 text-stone-800' },
  { value: 'pet',            label: 'Pet / Animal',       color: 'bg-yellow-100 text-yellow-700' },
  { value: 'other',          label: 'Other',              color: 'bg-slate-100 text-slate-800' }
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

export const HIRING_CATEGORIES = [
  { value: 'maid',         label: 'Maid / Housekeeping' },
  { value: 'cook',         label: 'Cook' },
  { value: 'car_cleaner',  label: 'Car cleaner' },
  { value: 'driver',       label: 'Driver' },
  { value: 'nanny',        label: 'Nanny / Babysitter' },
  { value: 'elderly_care', label: 'Elderly care' },
  { value: 'gardener',     label: 'Gardener' },
  { value: 'electrician',  label: 'Electrician' },
  { value: 'plumber',      label: 'Plumber' },
  { value: 'carpenter',    label: 'Carpenter' },
  { value: 'tutor',        label: 'Tutor' },
  { value: 'yoga_trainer', label: 'Yoga / Fitness trainer' },
  { value: 'pet_care',     label: 'Pet walker / sitter' },
  { value: 'laundry',      label: 'Laundry / Ironing' },
  { value: 'other',        label: 'Other' }
]

export const BUSINESS_CATEGORIES = [
  { value: 'food',            label: 'Food & Bakery' },
  { value: 'fashion',         label: 'Fashion & Apparel' },
  { value: 'health',          label: 'Health & Wellness' },
  { value: 'beauty',          label: 'Beauty & Salon' },
  { value: 'education',       label: 'Education & Coaching' },
  { value: 'home_services',   label: 'Home services' },
  { value: 'technology',      label: 'Technology / IT' },
  { value: 'real_estate',     label: 'Real estate' },
  { value: 'events',          label: 'Events & Catering' },
  { value: 'retail',          label: 'Retail / Shop' },
  { value: 'finance',         label: 'Finance & Consulting' },
  { value: 'travel',          label: 'Travel' },
  { value: 'automobile',      label: 'Automobile' },
  { value: 'other',           label: 'Other' }
]

export const CURRENCY = '₹'

// When true, Smartworld + M3M Soulitude are presented as a single unified
// community — society badges are hidden across the UI. Set to false later
// to visually segregate content by society. (Underlying society_id is
// always stored in the DB for future segregation.)
export const COMMUNITY_UNIFIED = true

export function formatMonthYear(date = new Date()) {
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}
