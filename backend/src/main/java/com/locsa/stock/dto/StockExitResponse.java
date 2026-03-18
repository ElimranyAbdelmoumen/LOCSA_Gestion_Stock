package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockExitResponse {
    private Long id;
    private String productName;
    private LocalDate dateExit;
    private Long quantity;
    private String beneficiary;
    private String comment;
    private String createdBy;
}
