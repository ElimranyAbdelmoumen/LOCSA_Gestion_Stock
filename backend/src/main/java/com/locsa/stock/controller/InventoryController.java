package com.locsa.stock.controller;

import com.locsa.stock.dto.AdjustRequest;
import com.locsa.stock.dto.InventoryRequest;
import com.locsa.stock.dto.InventoryResponse;
import com.locsa.stock.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAll(Authentication auth) {
        boolean isAdmin = auth.getAuthorities().contains(
            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
        return ResponseEntity.ok(inventoryService.getAllInventories(auth.getName(), isAdmin));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody InventoryRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(inventoryService.createInventory(request, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adjust(@PathVariable Long id, @Valid @RequestBody AdjustRequest request) {
        try {
            return ResponseEntity.ok(inventoryService.adjustStock(id, request.getAdjustmentComment()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
