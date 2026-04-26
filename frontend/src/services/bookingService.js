import api from './api'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  )

const bookingService = {
  getBookings: async (filters = {}) => {
    const { data } = await api.get('/bookings', { params: cleanParams(filters) })
    return data
  },

  getBookingById: async (id) => {
    const { data } = await api.get(`/bookings/${id}`)
    return data
  },

  createBooking: async (payload) => {
    const { data } = await api.post('/bookings', payload)
    return data
  },

  approveBooking: async (id) => {
    const { data } = await api.put(`/bookings/${id}/approve`)
    return data
  },

  rejectBooking: async (id, rejectionReason) => {
    const { data } = await api.put(`/bookings/${id}/reject`, { rejectionReason })
    return data
  },

  cancelBooking: async (id) => {
    const { data } = await api.put(`/bookings/${id}/cancel`)
    return data
  },

  deleteBooking: async (id) => {
    await api.delete(`/bookings/${id}`)
  },
}

export default bookingService
