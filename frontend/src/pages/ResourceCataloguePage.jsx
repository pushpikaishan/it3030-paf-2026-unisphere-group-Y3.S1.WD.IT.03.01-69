import { useEffect, useMemo, useState } from 'react'
import ResourceCard from '../components/ResourceCard'
import ResourceDeleteConfirmation from '../components/ResourceDeleteConfirmation'
import ResourceFilters from '../components/ResourceFilters'
import ResourceForm from '../components/ResourceForm'
import ResourceSkeletonCard from '../components/ResourceSkeletonCard'
import {
  useCreateResource,
  useDeleteResource,
  useResources,
  useResourceTypes,
  useUpdateResource,
  useUpdateResourceStatus,
} from '../hooks/useResources'
import { useAuth } from '../hooks/useAuth'
import './css/resources.css'

const initialFilters = {
  search: '',
  type: '',
  minCapacity: 1,
  location: '',
  status: '',
}

const normalizeErrorMessage = (error, fallback) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallback
  return message
}

export default function ResourceCataloguePage({ managementEnabled = false }) {
  const { user } = useAuth()
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canManageResources = managementEnabled && isPrivileged

  const [filters, setFilters] = useState(initialFilters)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(8)

  const [formOpen, setFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350)
    return () => clearTimeout(timer)
  }, [filters.search])

  const queryParams = useMemo(
    () => ({
      page,
      size,
      search: debouncedSearch || undefined,
      type: filters.type || undefined,
      minCapacity: filters.minCapacity || undefined,
      location: filters.location || undefined,
      status: filters.status || undefined,
    }),
    [page, size, debouncedSearch, filters.type, filters.minCapacity, filters.location, filters.status],
  )

  const { data, isLoading, isError, error, refetch } = useResources(queryParams)
  const { data: resourceTypes } = useResourceTypes()

  const createMutation = useCreateResource()
  const updateMutation = useUpdateResource()
  const deleteMutation = useDeleteResource()
  const statusMutation = useUpdateResourceStatus()

  const content = data?.content || []
  const totalPages = data?.totalPages || 1

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const handleReset = () => {
    setFilters(initialFilters)
    setDebouncedSearch('')
    setPage(0)
  }

  const notify = (kind, message) => {
    setToast({ kind, message })
    setTimeout(() => setToast(null), 2500)
  }

  const handleFormSubmit = async (payload) => {
    if (!canManageResources) return
    try {
      if (editingResource) {
        await updateMutation.mutateAsync({ id: editingResource.id, payload })
        notify('success', 'Resource updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        notify('success', 'Resource created successfully')
      }
      setFormOpen(false)
      setEditingResource(null)
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Failed to save resource'))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!canManageResources) return
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      notify('success', 'Resource deleted successfully')
      setDeleteTarget(null)
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Failed to delete resource'))
    }
  }

  const handleToggleStatus = async (resource) => {
    if (!canManageResources) return
    const nextStatus = resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE'
    try {
      await statusMutation.mutateAsync({ id: resource.id, status: nextStatus })
      notify('success', `Resource marked ${nextStatus.replaceAll('_', ' ')}`)
    } catch (err) {
      notify('error', normalizeErrorMessage(err, 'Failed to update status'))
    }
  }

  return (
    <section className="resource-layout">
      <ResourceFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        types={resourceTypes || []}
      />

      <div className="resource-main">
        <header className="resource-header card">
          <div>
            <h2>Facilities Catalogue</h2>
            <p className="muted">
              {canManageResources
                ? 'Browse and manage campus facilities and assets.'
                : 'Browse campus facilities and assets.'}
            </p>
          </div>

          <div className="resource-header-actions">
            <label>
              Page size
              <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </label>
            {canManageResources && (
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setEditingResource(null)
                  setFormOpen(true)
                }}
              >
                Add Resource
              </button>
            )}
          </div>
        </header>

        {toast && <div className={`resource-toast ${toast.kind}`}>{toast.message}</div>}

        {isLoading && (
          <div className="resource-grid">
            {Array.from({ length: size }).map((_, idx) => (
              <ResourceSkeletonCard key={idx} />
            ))}
          </div>
        )}

        {isError && (
          <div className="card">
            <h3>Could not load resources</h3>
            <p>{normalizeErrorMessage(error, 'Please try again in a moment.')}</p>
            <button className="btn" type="button" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="resource-grid">
              {content.length === 0 && (
                <div className="card resource-empty">
                  <h3>No resources found</h3>
                  <p>Try adjusting your filters or search terms.</p>
                </div>
              )}

              {content.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isAdmin={canManageResources}
                  onEdit={(item) => {
                    setEditingResource(item)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>

            <div className="resource-pagination card">
              <button className="btn" type="button" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>
                Previous
              </button>
              <span>
                Page {Math.min(page + 1, totalPages)} of {totalPages}
              </span>
              <button
                className="btn"
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <ResourceForm
        isOpen={canManageResources && formOpen}
        resource={editingResource}
        types={resourceTypes || []}
        onClose={() => {
          setFormOpen(false)
          setEditingResource(null)
        }}
        onSubmit={handleFormSubmit}
      />

      <ResourceDeleteConfirmation
        isOpen={canManageResources && Boolean(deleteTarget)}
        resourceName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  )
}
