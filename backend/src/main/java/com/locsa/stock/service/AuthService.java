package com.locsa.stock.service;

import com.locsa.stock.dto.*;
import com.locsa.stock.entity.Role;
import com.locsa.stock.entity.User;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final AuditService auditService;

    private String currentAdmin() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(userDetails);
        String city = user.getCity() != null ? user.getCity().name() : null;
        return new AuthResponse(token, user.getUsername(), user.getRole().name(), city);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (request.getRole() == Role.USER && request.getCity() == null) {
            throw new RuntimeException("La ville est requise pour un utilisateur");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .city(request.getRole() == Role.USER ? request.getCity() : null)
                .build();

        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);
        String city = user.getCity() != null ? user.getCity().name() : null;
        return new AuthResponse(token, user.getUsername(), user.getRole().name(), city);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole().name(),
                        u.getCity() != null ? u.getCity().name() : null, u.isActive()))
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
        // Ensure USER always has a city
        if (user.getRole() == Role.USER && user.getCity() == null) {
            throw new RuntimeException("La ville est requise pour un utilisateur");
        }

        userRepository.save(user);
        auditService.log("USER", id, "UPDATE", currentAdmin(),
                "Profil modifié: " + user.getUsername()
                + " rôle=" + user.getRole().name()
                + (user.getCity() != null ? " ville=" + user.getCity().name() : ""), null);
        return new UserResponse(user.getId(), user.getUsername(), user.getRole().name(),
                user.getCity() != null ? user.getCity().name() : null, user.isActive());
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
                user.getCity() != null ? user.getCity().name() : null, user.isActive());
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        auditService.log("USER", id, "DELETE", currentAdmin(),
                "Compte supprimé: " + user.getUsername(), null);
        userRepository.delete(user);
    }
}
