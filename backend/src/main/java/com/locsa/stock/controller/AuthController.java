package com.locsa.stock.controller;

import com.locsa.stock.dto.AuthResponse;
import com.locsa.stock.dto.LoginRequest;
import com.locsa.stock.dto.RegisterRequest;
import com.locsa.stock.security.LoginAttemptService;
import com.locsa.stock.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptService loginAttemptService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String username = request.getUsername();
        if (loginAttemptService.isBlocked(username)) {
            long remaining = loginAttemptService.remainingLockSeconds(username);
            return ResponseEntity.status(429).body(Map.of(
                "error", "Compte temporairement bloqué après trop de tentatives. Réessayez dans " + remaining + " secondes."
            ));
        }
        try {
            AuthResponse response = authService.login(request);
            loginAttemptService.loginSucceeded(username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            loginAttemptService.loginFailed(username);
            return ResponseEntity.status(401).body(Map.of("error", "Nom d'utilisateur ou mot de passe incorrect"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
