package com.locsa.stock.controller;

import com.locsa.stock.dto.StockEntryRequest;
import com.locsa.stock.dto.StockEntryResponse;
import com.locsa.stock.service.StockEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entries")
@RequiredArgsConstructor
public class StockEntryController {

    private final StockEntryService stockEntryService;

    @GetMapping
    public ResponseEntity<List<StockEntryResponse>> getAllEntries(Authentication auth) {
        boolean isAdmin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        return ResponseEntity.ok(stockEntryService.getAllEntries(auth.getName(), isAdmin));
    }

    @PostMapping
    public ResponseEntity<?> createEntry(@Valid @RequestBody StockEntryRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(stockEntryService.createEntry(request, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
