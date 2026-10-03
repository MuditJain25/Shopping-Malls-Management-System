package com.mallhub.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.mallhub.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

// Final-mode only: demo profile never calls this (see AuthService).
@Component
public class GoogleTokenVerifier {
    private final String clientId;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId;
    }

    public GoogleIdToken.Payload verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw ApiException.badRequest("Google login not configured (missing GOOGLE_CLIENT_ID)");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null || token.getPayload() == null
                    || !Boolean.TRUE.equals(token.getPayload().getEmailVerified())) {
                throw ApiException.unauthorized("Invalid Google ID token");
            }
            return token.getPayload();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.unauthorized("Google token verification failed");
        }
    }
}
