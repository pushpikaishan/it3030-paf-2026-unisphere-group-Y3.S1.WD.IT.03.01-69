import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resourceApi } from '../services/resourceApi'

export const useResources = (params) =>
  useQuery({
    queryKey: ['resources', params],
    queryFn: () => resourceApi.getResources(params),
    staleTime: 15000,
    retry: (failureCount, error) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) return false
      return failureCount < 2
    },
  })

export const useResource = (id) =>
  useQuery({
    queryKey: ['resource', id],
    queryFn: () => resourceApi.getResourceById(id),
    enabled: Boolean(id),
  })

export const useResourceTypes = () =>
  useQuery({
    queryKey: ['resource-types'],
    queryFn: resourceApi.getResourceTypes,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) return false
      return failureCount < 2
    },
  })

export const useCreateResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resourceApi.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

export const useUpdateResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => resourceApi.updateResource(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', String(variables.id)] })
    },
  })
}

export const useDeleteResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => resourceApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}

export const useUpdateResourceStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => resourceApi.updateResourceStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', String(variables.id)] })
    },
  })
}
