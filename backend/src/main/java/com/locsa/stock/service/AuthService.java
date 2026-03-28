package com.locsa.stock.service;

import com.locsa.stock.dto.*;
import com.locsa.stock.entity.PasswordResetToken;
import com.locsa.stock.entity.Role;
import com.locsa.stock.entity.User;
import com.locsa.stock.repository.PasswordResetTokenRepository;
import com.locsa.stock.repository.UserRepository;
import com.locsa.stock.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final AuditService auditService;
    private final EmailService emailService;
    private final PasswordResetTokenRepository resetTokenRepository;

    private String currentAdmin() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
    }

    private List<String> buildCities(User user) {
        List<String> cities = new ArrayList<>();
        if (user.getCity() != null) cities.add(user.getCity().name());
        if (user.getAdditionalCities() != null) {
            user.getAdditionalCities().forEach(c -> cities.add(c.name()));
        }
        return cities;
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou mot de passe incorrect"));

        // Authenticate using the internal username (Spring Security principal)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);
        String city = user.getCity() != null ? user.getCity().name() : null;
        String avatarUrl = user.getAvatarPath() != null ? "/api/users/" + user.getId() + "/avatar" : null;
        return new AuthResponse(token, user.getUsername(), user.getRole().name(), city, user.getId(), avatarUrl, buildCities(user));
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (request.getRole() == Role.USER && request.getCity() == null) {
            throw new RuntimeException("La ville est requise pour un utilisateur");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        String rawPassword = request.getPassword();

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(rawPassword))
                .role(request.getRole())
                .city(request.getRole() == Role.USER ? request.getCity() : null)
                .additionalCities(request.getRole() == Role.USER && request.getAdditionalCities() != null
                        ? request.getAdditionalCities() : new HashSet<>())
                .email(request.getEmail().trim())
                .build();

        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername(), rawPassword);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);
        String city = user.getCity() != null ? user.getCity().name() : null;
        return new AuthResponse(token, user.getUsername(), user.getRole().name(), city, user.getId(), null, buildCities(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole().name(),
                        u.getCity() != null ? u.getCity().name() : null, u.isActive(),
                        u.getAvatarPath() != null ? "/api/users/" + u.getId() + "/avatar" : null,
                        u.getEmail(), buildCities(u)))
                .toList();
    }

    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String newUsername = request.getUsername().trim();
            if (!newUsername.equals(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("Ce nom d'utilisateur est déjà pris");
            }
            user.setUsername(newUsername);
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
            if (request.getRole() == Role.ADMIN) {
                user.setCity(null);
            }
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getAdditionalCities() != null) {
            user.setAdditionalCities(request.getAdditionalCities());
        }
        if (request.getEmail() != null) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.isEmpty() && !newEmail.equals(user.getEmail())
                    && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Cet email est déjà utilisé");
            }
            user.setEmail(newEmail.isEmpty() ? null : newEmail);
        }
        if (user.getRole() == Role.USER && user.getCity() == null) {
            throw new RuntimeException("La ville est requise pour un utilisateur");
        }

        userRepository.save(user);
        auditService.log("USER", id, "UPDATE", currentAdmin(),
                "Profil modifié: " + user.getUsername()
                + " rôle=" + user.getRole().name()
                + (user.getCity() != null ? " ville=" + user.getCity().name() : ""), null);
        return new UserResponse(user.getId(), user.getUsername(), user.getRole().name(),
                user.getCity() != null ? user.getCity().name() : null, user.isActive(),
                user.getAvatarPath() != null ? "/api/users/" + user.getId() + "/avatar" : null,
                user.getEmail(), buildCities(user));
    }

    public void changePassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log("USER", id, "UPDATE", currentAdmin(),
                "Mot de passe modifié pour: " + user.getUsername(), null);
    }

    public UserResponse toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("Impossible de suspendre un administrateur");
        }
        boolean wasSuspended = !user.isActive();
        user.setActive(!user.isActive());
        userRepository.save(user);
        auditService.log("USER", id, "UPDATE", currentAdmin(),
                (wasSuspended ? "Compte réactivé: " : "Compte suspendu: ") + user.getUsername(), null);
        return new UserResponse(user.getId(), user.getUsername(), user.getRole().name(),
                user.getCity() != null ? user.getCity().name() : null, user.isActive(),
                user.getAvatarPath() != null ? "/api/users/" + user.getId() + "/avatar" : null,
                user.getEmail(), buildCities(user));
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        auditService.log("USER", id, "DELETE", currentAdmin(),
                "Compte supprimé: " + user.getUsername(), null);
        userRepository.delete(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return; // silent — don't reveal if email exists

        // Delete old tokens
        resetTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        resetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(email, token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Lien invalide ou expiré"));

        if (resetToken.isUsed()) throw new RuntimeException("Ce lien a déjà été utilisé");
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Ce lien a expiré");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);
    }
}
