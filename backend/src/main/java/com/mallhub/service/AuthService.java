package com.mallhub.service;

import com.mallhub.dto.AuthDtos;
import com.mallhub.entity.AppUser;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import com.mallhub.security.AppTokenProvider;
import com.mallhub.security.GoogleTokenVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final boolean authEnabled;
    private final GoogleTokenVerifier google;
    private final AppTokenProvider tokens;
    private final UserRepository users;
    private final TenantRepository tenants;
    private final EmployeeRepository employees;
    private final MallManagerRepository managers;
    private final ExecutiveRepository executives;

    public AuthService(@Value("${app.auth.enabled:true}") boolean authEnabled,
                       GoogleTokenVerifier google, AppTokenProvider tokens,
                       UserRepository users, TenantRepository tenants,
                       EmployeeRepository employees, MallManagerRepository managers,
                       ExecutiveRepository executives) {
        this.authEnabled = authEnabled;
        this.google = google;
        this.tokens = tokens;
        this.users = users;
        this.tenants = tenants;
        this.employees = employees;
        this.managers = managers;
        this.executives = executives;
    }

    @Transactional
    public AuthDtos.AuthResponse exchange(AuthDtos.GoogleLoginRequest req) {
        String email;
        String firstName = req.firstName();
        String lastName = req.lastName();
        String googleSub = null;
        if (authEnabled) {
            if (req.idToken() == null || req.idToken().isBlank()) {
                throw ApiException.badRequest("id_token is required");
            }
            var payload = google.verify(req.idToken());
            email = payload.getEmail();
            if (firstName == null) firstName = (String) payload.get("given_name");
            if (lastName == null) lastName = (String) payload.get("family_name");
            googleSub = payload.getSubject();
        } else {
            // Demo mode: email identifies the user, no proof checked.
            if (req.email() == null || req.email().isBlank()) {
                throw ApiException.badRequest("email is required in demo mode");
            }
            email = req.email();
        }
        Resolved resolved = resolve(email, firstName, lastName, googleSub);
        String token = tokens.issue(email, resolved.role(), resolved.profileId());
        var user = new AuthDtos.UserResponse(resolved.userId(), email, resolved.role(),
                resolved.firstName(), resolved.lastName(), resolved.profileId());
        return new AuthDtos.AuthResponse(token, user);
    }

    // Fixed precedence so an email present in two tables always maps the same way.
    private Resolved resolve(String email, String firstName, String lastName, String googleSub) {
        var exec = executives.findByEmail(email);
        if (exec.isPresent()) {
            var e = exec.get();
            return new Resolved(e.getExecutiveId(), "executive", e.getExecutiveId(),
                    e.getFirstName(), e.getLastName());
        }
        var mgr = managers.findByEmail(email);
        if (mgr.isPresent()) {
            var m = mgr.get();
            return new Resolved(m.getManagerId(), "mall_manager", m.getManagerId(),
                    m.getFirstName(), m.getLastName());
        }
        var tenant = tenants.findByEmail(email);
        if (tenant.isPresent()) {
            var t = tenant.get();
            String[] names = splitName(t.getBusinessName());
            return new Resolved(t.getTenantId(), "tenant", t.getTenantId(), names[0], names[1]);
        }
        var emp = employees.findByEmail(email);
        if (emp.isPresent()) {
            var e = emp.get();
            String role = e.getCurrentDesignation() != null
                    && e.getCurrentDesignation().equalsIgnoreCase("shop manager")
                    ? "shop_manager" : "employee";
            return new Resolved(e.getEmployeeId(), role, e.getEmployeeId(),
                    e.getFirstName(), e.getLastName());
        }
        var user = users.findByEmail(email);
        AppUser u;
        if (user.isPresent()) {
            u = user.get();
            if (googleSub != null && u.getGoogleSub() == null) {
                u.setGoogleSub(googleSub);
            }
        } else {
            u = new AppUser();
            u.setFirstName(firstName != null ? firstName : "Demo");
            u.setLastName(lastName != null ? lastName : "User");
            u.setEmail(email);
            u.setGoogleSub(googleSub);
            u = users.save(u);
        }
        return new Resolved(u.getUserId(), "customer", u.getUserId(), u.getFirstName(), u.getLastName());
    }

    private String[] splitName(String businessName) {
        if (businessName == null || businessName.isBlank()) return new String[]{"Tenant", ""};
        String[] parts = businessName.split("\\s+", 2);
        return parts.length == 1 ? new String[]{parts[0], ""} : parts;
    }

    private record Resolved(Integer userId, String role, Integer profileId,
                            String firstName, String lastName) {
    }
}
