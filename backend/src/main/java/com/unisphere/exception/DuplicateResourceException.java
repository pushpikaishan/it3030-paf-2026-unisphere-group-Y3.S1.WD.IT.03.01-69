package com.unisphere.exception;

public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String name) {
        super("Resource with name '" + name + "' already exists");
    }
}
