package com.mallhub.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

// Role checks only matter when authentication is on. Demo mode keeps its
// open API so the seeded demo and smoke tests work without Google setup.
@Configuration
@EnableMethodSecurity
@ConditionalOnProperty(name = "app.auth.enabled", havingValue = "true", matchIfMissing = true)
public class MethodSecurityConfig {
}
