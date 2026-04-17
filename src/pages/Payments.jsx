import { CreditCard, IndianRupee, Droplets, Car, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { usePayments, useMarkPaid } from '../hooks/usePayments.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { CURRENCY, formatMonthYear } from '../lib/constants.js'

const statusColor = {
  pending:  'bg-amber-100 text-amber-800',
  paid:     'bg-emerald-100 text-emerald-700',
  overdue:  'bg-red-100 text-red-700'
}

function money(v) { return `${CURRENCY}${(v || 0).toLocaleString('en-IN')}` }

export default function Payments() {
  const { data: payments = [], isLoading } = usePayments()
  const markPaid = useMarkPaid()

  const thisMonth = formatMonthYear()
  const current = payments.find((p) => p.month_year === thisMonth) || payments[0]

  function payNow(p) {
    // Placeholder UPI deep-link — replace with real gateway/Razorpay integration later
    const upi = `upi://pay?pa=society@upi&pn=SocietyConnect&am=${p.total_amount}&cu=INR&tn=${encodeURIComponent(p.month_year + ' dues')}`
    const ref = `UPI-${Date.now()}`
    window.location.href = upi
    // Optimistically mark paid for demo purposes — real flow would verify via webhook
    markPaid.mutate({ id: p.id, payment_ref: ref })
  }

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner/></div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Payments</h1>

      {current ? (
        <Card className="p-5 space-y-4 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-80">Dues for</div>
              <div className="font-semibold">{current.month_year}</div>
            </div>
            <Badge color={statusColor[current.status]}>{current.status}</Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <IndianRupee size={22}/>
            <span className="text-4xl font-bold tracking-tight">{(current.total_amount||0).toLocaleString('en-IN')}</span>
          </div>
          <div className="space-y-1.5 text-sm opacity-90">
            <Row icon={Wrench}    label="Maintenance" value={money(current.maintenance_amount)} />
            <Row icon={Droplets}  label="Water"       value={money(current.water_amount)} />
            <Row icon={Car}       label="Parking"     value={money(current.parking_amount)} />
          </div>
          {current.status !== 'paid' && (
            <Button variant="secondary" className="w-full" onClick={() => payNow(current)}>
              <CreditCard size={16}/> Pay now
            </Button>
          )}
        </Card>
      ) : (
        <Card className="p-0"><EmptyState title="No dues yet" subtitle="Your committee will post your monthly bill here." /></Card>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Payment history</h2>
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.month_year}</div>
                <div className="text-[11px] text-slate-500">
                  {p.paid_at ? `Paid ${format(new Date(p.paid_at), 'dd MMM, yyyy')}` : 'Unpaid'}
                  {p.payment_ref && ` · ${p.payment_ref}`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{money(p.total_amount)}</div>
                <Badge color={statusColor[p.status]}>{p.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2"><Icon size={14}/>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
