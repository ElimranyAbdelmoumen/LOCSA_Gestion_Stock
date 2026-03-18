package com.locsa.stock.service;

import com.locsa.stock.dto.DashboardResponse;
import com.locsa.stock.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final StockEntryService stockEntryService;
    private final StockExitService stockExitService;
    private final InventoryService inventoryService;

    public DashboardResponse getDashboard() {
        Long totalStock = productRepository.getTotalStock();
        if (totalStock == null) totalStock = 0L;

        long totalProducts = productRepository.count();
        long lowStockCount = productRepository.findLowStockProducts(5).size();

        return new DashboardResponse(
                totalStock,
                totalProducts,
                lowStockCount,
                stockEntryService.getRecentEntries(),
                stockExitService.getRecentExits(),
                inventoryService.countNegativeGap(),
                inventoryService.countPositiveGap()
        );
    }
}
