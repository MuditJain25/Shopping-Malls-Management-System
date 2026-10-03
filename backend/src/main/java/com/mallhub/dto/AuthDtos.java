package com.mallhub.dto;

public final class AuthDtos {
    private AuthDtos() {
    }

    // Demo mode sends email only; final mode sends idToken (email optional, used as display hint).
    public record GoogleLoginRequest(String idToken, String email, String firstName, String lastName) {
    }

    public record UserResponse(Integer id, String email, String role,
                               String firstName, String lastName, Integer profileId) {
    }

    public record AuthResponse(String token, UserResponse user) {
    }
}
