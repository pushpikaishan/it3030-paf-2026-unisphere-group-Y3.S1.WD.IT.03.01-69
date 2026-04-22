export default function BookingActionButtons({
  mode = 'user',
  booking,
  rejectionReason,
  onRejectReasonChange,
  onApprove,
  onReject,
  onCancel,
  busy,
}) {
  const isOwnerActionAllowed = mode === 'user' && booking?.status === 'APPROVED'
  const isAdminActionAllowed = mode === 'admin' && booking?.status === 'PENDING'

  return (
    <div className="booking-actions">
      {isAdminActionAllowed && (
        <>
          <button className="button" type="button" onClick={() => onApprove?.(booking)} disabled={busy}>
            Approve
          </button>
          <button className="ghost" type="button" onClick={() => onReject?.(booking)} disabled={busy}>
            Reject
          </button>
          <textarea
            className="booking-reject-input"
            rows="2"
            value={rejectionReason || ''}
            onChange={(event) => onRejectReasonChange?.(booking, event.target.value)}
            placeholder="Rejection reason"
          />
        </>
      )}

      {isOwnerActionAllowed && (
        <button className="ghost" type="button" onClick={() => onCancel?.(booking)} disabled={busy}>
          Cancel
        </button>
      )}
    </div>
  )
}