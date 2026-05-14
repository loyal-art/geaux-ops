// ── Notary Details Card ───────────────────────────────────────────────────────
//
// Renders the structured fields captured by the Notary Request intake flow
// (see /jobs/new/notary). Sits above the F1/F2 cards on the job detail page
// when `job_metadata.job_type === 'notary'`.

type NotaryMetadata = {
  client_email?:         string | null
  client_phone?:         string | null
  signer_name?:          string | null
  location_address?:     string | null
  proposed_date?:        string | null
  proposed_time?:        string | null
  document_type?:        string | null
  number_of_signatures?: number | null
  witness_requirement?:  string | null
  service_quote?:        number | null
  special_instructions?: string | null
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  // dateStr is YYYY-MM-DD; parse as local date to avoid TZ drift.
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null
  // timeStr is HH:MM (24h).
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return timeStr
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] uppercase tracking-wider flex-shrink-0" style={{ color: '#8B8F9E' }}>{label}</span>
      <span className="text-sm text-right" style={{ color: '#E8E9ED' }}>{value}</span>
    </div>
  )
}

export function NotaryDetailsCard({ metadata }: { metadata: NotaryMetadata }) {
  const dateLabel = formatDate(metadata.proposed_date)
  const timeLabel = formatTime(metadata.proposed_time)
  const dateTime  = [dateLabel, timeLabel].filter(Boolean).join(' · ')

  const quote = typeof metadata.service_quote === 'number'
    ? `$${metadata.service_quote.toFixed(2)}`
    : null

  return (
    <div
      className="px-4 py-3 rounded-xl mb-2"
      style={{
        backgroundColor: 'rgba(200,164,78,0.06)',
        borderLeft:      '3px solid #C8A44E',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden>📜</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8A44E' }}>
          Notary Details
        </p>
      </div>

      <div className="space-y-0.5">
        {metadata.signer_name          && <Row label="Signer"      value={metadata.signer_name} />}
        {metadata.location_address     && <Row label="Location"    value={metadata.location_address} />}
        {dateTime                      && <Row label="When"        value={dateTime} />}
        {metadata.document_type        && <Row label="Document"    value={metadata.document_type} />}
        {typeof metadata.number_of_signatures === 'number' && (
          <Row label="Signatures" value={metadata.number_of_signatures} />
        )}
        {metadata.witness_requirement  && <Row label="Witnesses"   value={metadata.witness_requirement} />}
        {quote                         && <Row label="Quote"       value={quote} />}
        {metadata.client_email         && <Row label="Client Email" value={metadata.client_email} />}
        {metadata.client_phone         && <Row label="Client Phone" value={metadata.client_phone} />}
      </div>

      {metadata.special_instructions && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8B8F9E' }}>
            Special Instructions
          </p>
          <p className="text-sm italic leading-relaxed" style={{ color: '#E8E9ED' }}>
            {metadata.special_instructions}
          </p>
        </div>
      )}
    </div>
  )
}
