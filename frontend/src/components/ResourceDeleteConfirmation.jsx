export default function ResourceDeleteConfirmation({ isOpen, resourceName, onCancel, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="resource-modal-backdrop" role="dialog" aria-modal="true">
      <div className="resource-modal card">
        <h3>Delete resource?</h3>
        <p>
          This action cannot be undone. You are deleting <strong>{resourceName}</strong>.
        </p>
        <div className="resource-modal-footer">
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn danger" type="button" onClick={onConfirm}>
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}
