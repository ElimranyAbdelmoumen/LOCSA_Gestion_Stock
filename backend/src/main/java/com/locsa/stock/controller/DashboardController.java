package com.locsa.stock.controller;

import com.locsa.stock.dto.DashboardResponse;
import com.locsa.stock.dto.StatsResponse;
import com.locsa.stock.service.DashboardService;
import com.locsa.stock.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final StatsService statsService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(statsService.getStats(period));
    }
}
