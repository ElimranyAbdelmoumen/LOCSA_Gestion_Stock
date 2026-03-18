package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardResponse {
    private Long totalStock;
    private Long totalProducts;
    private Long lowStockCount;
    private List<StockEntryResponse> recentEntries;
    private List<StockExitResponse> recentExits;
    private Long negativeGapCount;
    private Long positiveGapCount;
}
