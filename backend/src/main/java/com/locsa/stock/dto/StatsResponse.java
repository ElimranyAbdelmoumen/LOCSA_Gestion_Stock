package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class StatsResponse {
    private String period;
    private Long entriesTotal;
    private Long exitsTotal;
    private List<ChartPoint> chartData;

    @Data
    @AllArgsConstructor
    public static class ChartPoint {
        private String label;
        private Long entries;
        private Long exits;
    }
}
