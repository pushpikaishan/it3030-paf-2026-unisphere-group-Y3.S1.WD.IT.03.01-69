import api from './api'

export const bookingApi = {
  requestBooking: async (payload) => {
    const { data } = await api.post('/bookings/request', payload)
    return data
  },
  getMyBookings: async () => {
    const { data } = await api.get('/bookings/my')
    return data
  },
  getBookings: async (params = {}) => {
    const { data } = await api.get('/bookings', { params })
    return data
  },
  getBookingById: async (id) => {
    const { data } = await api.get(`/bookings/${id}`)
    return data
  },
  approveBooking: async (id) => {
    const { data } = await api.patch(`/bookings/${id}/approve`)
    return data
  },
  rejectBooking: async (id, reason) => {
    const { data } = await api.patch(`/bookings/${id}/reject`, { reason })
    return data
  },
  cancelBooking: async (id) => {
    const { data } = await api.patch(`/bookings/${id}/cancel`)
    return data
  },
  deleteBooking: async (id) => {
    await api.delete(`/bookings/${id}`)
  },
}
