
import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookingContext } from '../context/BookingContext'
import { bookingApi } from '../services/bookingApi'

export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings must be used within BookingProvider')
  return ctx

}

export const useMyBookings = (enabled = true) =>
  useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.getMyBookings,
    enabled,
    staleTime: 10000,
    retry: (failureCount, error) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) return false
      return failureCount < 2
    },
  })

export const useAdminBookings = (params) =>
  useQuery({
    queryKey: ['admin-bookings', params],
    queryFn: () => bookingApi.getBookings(params),
    staleTime: 10000,
    retry: (failureCount, error) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) return false
      return failureCount < 2
    },
  })

export const useApproveBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingApi.approveBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })
}

export const useRejectBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => bookingApi.rejectBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })
}

export const useCancelBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })
}

export const useDeleteBooking = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => bookingApi.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
    },
  })
}
