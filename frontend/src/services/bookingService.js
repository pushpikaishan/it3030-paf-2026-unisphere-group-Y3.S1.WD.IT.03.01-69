import api from './api'

export const BOOKING_RESOURCES = [
  { value: 'Lecture Hall A', label: 'Lecture Hall A' },
  { value: 'Lecture Hall B', label: 'Lecture Hall B' },
  { value: 'Seminar Room 1', label: 'Seminar Room 1' },
  { value: 'Seminar Room 2', label: 'Seminar Room 2' },
  { value: 'Computer Lab 1', label: 'Computer Lab 1' },
  { value: 'Computer Lab 2', label: 'Computer Lab 2' },
  { value: 'Auditorium', label: 'Auditorium' },
  { value: 'Meeting Room', label: 'Meeting Room' },
]

const extractMessage = (error, fallback) => {
  const raw = error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  return raw || fallback
}

export const bookingService = {
  createBooking: async (payload) => {
    try {
      const { data } = await api.post('/bookings', payload)
      return data
    } catch (error) {
      throw new Error(extractMessage(error, 'Booking request failed'))
    }
  },

  getMyBookings: async () => {
    try {
      const { data } = await api.get('/bookings/my')
      return data
    } catch (error) {
      throw new Error(extractMessage(error, 'Failed to load your bookings'))
    }
  },

  getAllBookings: async (filters = {}) => {
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.resource) params.resource = filters.resource
      if (filters.date) params.date = filters.date
      const { data } = await api.get('/bookings', { params })
      return data
    } catch (error) {
      throw new Error(extractMessage(error, 'Failed to load bookings'))
    }
  },

  approveBooking: async (id) => {
    try {
      const { data } = await api.put(`/bookings/${id}/approve`)
      return data
    } catch (error) {
      throw new Error(extractMessage(error, 'Failed to approve booking'))
    }
  },

  rejectBooking: async (id, reason) => {
    try {
      const { data } = await api.put(`/bookings/${id}/reject`, { rejectionReason: reason })
      return data
    } catch (error) {
      throw new Error(extractMessage(error, 'Failed to reject booking'))
    }
  },

  cancelBooking: async (id) => {
    try {
      const { data } = await api.put(`/bookings/${id}/cancel`)
      return data
    } catch (error) {
      throw new Error(extractMessage(error, 'Failed to cancel booking'))
    }
  },
}