package com.locsa.stock.controller;

import com.locsa.stock.dto.StockExitRequest;
import com.locsa.stock.dto.StockExitResponse;
import com.locsa.stock.service.StockExitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exits")
@RequiredArgsConstructor
public class StockExitController {

    private final StockExitService stockExitService;

    @GetMapping
    public ResponseEntity<List<StockExitResponse>> getAllExits(Authentication auth) {
        boolean isAdmin = auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        return ResponseEntity.ok(stockExitService.getAllExits(auth.getName(), isAdmin));
    }

    @PostMapping
    public ResponseEntity<?> createExit(@Valid @RequestBody StockExitRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(stockExitService.createExit(request, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
