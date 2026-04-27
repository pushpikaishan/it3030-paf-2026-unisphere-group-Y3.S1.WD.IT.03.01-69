import api from './api'

export const bookingApi = {
  requestBooking: async (payload) => {
    const { data } = await api.post('/bookings/request', payload)
    return data
  },
  getBookedSlots: async (resourceId, date) => {
    const { data } = await api.get(`/bookings/resource/${resourceId}/slots`, { params: { date } })
    return data
  },
  getMyBookings: async () => {
    const { data } = await api.get('/bookings/my')
    return data
  },
  getBookings: async (params = {}) => {
    const { data } = await api.get('/bookings', { params })
    if (Array.isArray(data)) {
      return {
        content: data,
        totalPages: 1,
        totalElements: data.length,
        number: 0,
        size: data.length,
      }
    }
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
