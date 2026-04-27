package com.unisphere.exception;

public class ResourceHasActiveBookingsException extends RuntimeException {
    public ResourceHasActiveBookingsException(Long id) {
        super("Resource " + id + " cannot be deleted because it has active bookings");
    }
}
