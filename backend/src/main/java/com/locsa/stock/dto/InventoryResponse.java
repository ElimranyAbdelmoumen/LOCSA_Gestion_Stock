package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class InventoryResponse {
    private Long id;
    private String productName;
    private Long systemQuantity;
    private Long realQuantity;
    private Long difference;
    private LocalDate dateInventory;
    private String comment;
    private String adjustmentComment;
    private String createdBy;
}
