export default function ResourceStatusBadge({ status }) {
  const normalized = status === 'OUT_OF_SERVICE' ? 'OUT OF SERVICE' : 'ACTIVE'
  const cls = status === 'OUT_OF_SERVICE' ? 'resource-status danger' : 'resource-status success'

  return <span className={cls}>{normalized}</span>
}
