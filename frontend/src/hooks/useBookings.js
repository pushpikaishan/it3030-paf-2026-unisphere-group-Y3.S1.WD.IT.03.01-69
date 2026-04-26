import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '../services/bookingApi'

export const useMyBookings = () =>
  useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.getMyBookings,
    staleTime: 15000,
  })

export const useAdminBookings = (params) =>
  useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingApi.getBookings(params),
    staleTime: 10000,
  })

export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bookingApi.requestBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export const useApproveBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingApi.approveBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })
}

export const useRejectBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => bookingApi.rejectBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })
}

export const useDeleteBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingApi.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })
}
