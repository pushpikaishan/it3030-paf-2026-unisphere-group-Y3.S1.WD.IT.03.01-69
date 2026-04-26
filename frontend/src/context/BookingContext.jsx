import { createContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'unisphere_bookings'

export const BookingContext = createContext(null)

const readStoredBookings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(() => readStoredBookings())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  }, [bookings])

  const addBooking = (resource, user) => {
    if (!user?.id && !user?.email) {
      return { ok: false, message: 'Please log in to book resources.' }
    }

    if (resource?.status !== 'ACTIVE') {
      return { ok: false, message: 'Only ACTIVE resources can be booked.' }
    }

    const userKey = String(user?.id || user?.email)
    const resourceId = String(resource?.id)

    const alreadyBooked = bookings.some(
      (booking) =>
        booking.resourceId === resourceId &&
        booking.userKey === userKey &&
        booking.status !== 'CANCELLED',
    )

    if (alreadyBooked) {
      return { ok: false, message: 'This resource is already booked by you.' }
    }

    const booking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      resourceId,
      resourceName: resource?.name,
      resourceType: resource?.type,
      location: resource?.location,
      capacity: resource?.capacity,
      description: resource?.description || null,
      availability: resource?.availabilityWindows || null,
      status: 'CONFIRMED',
      bookedAt: new Date().toISOString(),
      userKey,
      userId: user?.id ?? null,
      userName: user?.name || null,
      userEmail: user?.email || null,
    }

    setBookings((prev) => [booking, ...prev])
    return { ok: true, booking }
  }

  const cancelBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId && booking.status !== 'CANCELLED'
          ? { ...booking, status: 'CANCELLED', cancelledAt: new Date().toISOString() }
          : booking,
      ),
    )
  }

  const isBookedByUser = (resourceId, user) => {
    if (!resourceId || (!user?.id && !user?.email)) return false
    const userKey = String(user?.id || user?.email)
    return bookings.some(
      (booking) =>
        booking.resourceId === String(resourceId) &&
        booking.userKey === userKey &&
        booking.status !== 'CANCELLED',
    )
  }

  const getBookingsForUser = (user) => {
    if (!user?.id && !user?.email) return []
    const userKey = String(user?.id || user?.email)
    return bookings.filter((booking) => booking.userKey === userKey)
  }

  const value = useMemo(
    () => ({
      bookings,
      addBooking,
      cancelBooking,
      isBookedByUser,
      getBookingsForUser,
    }),
    [bookings],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
