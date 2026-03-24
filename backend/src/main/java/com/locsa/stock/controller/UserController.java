package com.locsa.stock.controller;

import com.locsa.stock.dto.ChangePasswordRequest;
import com.locsa.stock.dto.RegisterRequest;
import com.locsa.stock.dto.UpdateUserRequest;
import com.locsa.stock.dto.UserResponse;
import com.locsa.stock.entity.User;
import com.locsa.stock.repository.UserRepository;
import com.locsa.stock.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(Map.of("message", "Utilisateur créé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        try {
            return ResponseEntity.ok(authService.updateUser(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @Valid @RequestBody ChangePasswordRequest request) {
        try {
            authService.changePassword(id, request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(authService.toggleActive(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            authService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Upload avatar — admin or the user themselves */
    @PostMapping("/{id}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Long id,
                                          @RequestParam("file") MultipartFile file,
                                          Authentication auth) {
        // Allow only admin or the user uploading their own photo
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        User caller = userRepository.findByUsername(auth.getName()).orElse(null);
        if (!isAdmin && (caller == null || !caller.getId().equals(id))) {
            return ResponseEntity.status(403).body(Map.of("error", "Accès refusé"));
        }
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Seules les images sont acceptées"));
        }
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
            String ext = ct.contains("png") ? "png" : "jpg";
            String filename = id + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
            Path dir = Paths.get(uploadDir, "avatars");
            Files.createDirectories(dir);
            // Delete old avatar if present
            if (user.getAvatarPath() != null) {
                try { Files.deleteIfExists(Paths.get(uploadDir, user.getAvatarPath())); } catch (Exception ignored) {}
            }
            Path dest = dir.resolve(filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            user.setAvatarPath("avatars/" + filename);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("avatarUrl", "/api/users/" + id + "/avatar"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de l'upload"));
        }
    }

    /** Serve avatar image — public (no auth required, configured in SecurityConfig) */
    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null || user.getAvatarPath() == null) {
                return ResponseEntity.notFound().build();
            }
            Path path = Paths.get(uploadDir, user.getAvatarPath());
            if (!Files.exists(path)) return ResponseEntity.notFound().build();
            byte[] bytes = Files.readAllBytes(path);
            String ext = path.getFileName().toString().toLowerCase();
            MediaType mt = ext.endsWith("png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok().contentType(mt).body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
