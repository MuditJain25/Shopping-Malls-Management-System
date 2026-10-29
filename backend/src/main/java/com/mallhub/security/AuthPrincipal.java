package com.mallhub.security;

// Principal carried by the JWT filter: email plus the role/profile id issued in the token.
public record AuthPrincipal(String email, String role, Integer profileId) {
}
