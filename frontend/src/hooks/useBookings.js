
import { useContext } from 'react'
import { BookingContext } from '../context/BookingContext'

export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings must be used within BookingProvider')
  return ctx

}
