package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockEntryResponse {
    private Long id;
    private String productName;
    private LocalDate dateEntry;
    private Long quantity;
    private String comment;
    private String createdBy;
}
