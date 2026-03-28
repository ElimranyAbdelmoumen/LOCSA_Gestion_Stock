package com.locsa.stock.controller;

import com.locsa.stock.dto.StockEntryRequest;
import com.locsa.stock.entity.City;
import com.locsa.stock.entity.User;
import com.locsa.stock.repository.UserRepository;
import com.locsa.stock.service.StockEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/entries")
@RequiredArgsConstructor
public class StockEntryController {

    private final StockEntryService stockEntryService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllEntries(
            Authentication auth,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        boolean isAdmin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        Set<City> userCities = null;
        City cityFilter = null;
        if (isAdmin) {
            if (city != null && !city.isBlank()) {
                try { cityFilter = City.valueOf(city.toUpperCase()); } catch (IllegalArgumentException ignored) {}
            }
        } else {
            User user = userRepository.findByUsername(auth.getName()).orElseThrow();
            userCities = new HashSet<>();
            if (user.getCity() != null) userCities.add(user.getCity());
            if (user.getAdditionalCities() != null) userCities.addAll(user.getAdditionalCities());
            if (city != null && !city.isBlank()) {
                try { cityFilter = City.valueOf(city.toUpperCase()); } catch (IllegalArgumentException ignored) {}
            }
        }
        return ResponseEntity.ok(stockEntryService.getAllEntries(auth.getName(), isAdmin, userCities, cityFilter, dateFrom, dateTo, page, size));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancelEntry(@PathVariable Long id, Authentication auth) {
        try {
            stockEntryService.cancelEntry(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Entrée annulée"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createEntry(@Valid @RequestBody StockEntryRequest request, Authentication auth) {
        boolean isAdmin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        City forcedCity = null;
        if (!isAdmin) {
            User user = userRepository.findByUsername(auth.getName()).orElseThrow();
            forcedCity = user.getCity();
        }
        try {
            return ResponseEntity.ok(stockEntryService.createEntry(request, auth.getName(), forcedCity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
