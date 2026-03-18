package com.locsa.stock.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StockEntryRequest {

    @NotNull(message = "Product name is required")
    private String productName;

    @NotNull(message = "Entry date is required")
    private LocalDate dateEntry;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Long quantity;

    private String comment;
}
