package com.mallhub.controller;

import com.mallhub.dto.AuthDtos;
import com.mallhub.exception.ApiException;
import com.mallhub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/google")
    public AuthDtos.AuthResponse google(@Valid @RequestBody AuthDtos.GoogleLoginRequest req) {
        return auth.exchange(req);
    }

    @GetMapping("/me")
    public AuthDtos.AuthResponse me(@RequestParam(required = false) String email) {
        String resolved = email != null ? email : principalEmail();
        if (resolved == null) throw ApiException.unauthorized("Not signed in");
        // Reuse the exchange path with email only (no token re-verification here).
        return auth.exchange(new AuthDtos.GoogleLoginRequest(null, resolved, null, null));
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout() {
        return Map.of("success", true);
    }

    private String principalEmail() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated() || "anonymousUser".equals(a.getPrincipal())) return null;
        return a.getName();
    }
}
