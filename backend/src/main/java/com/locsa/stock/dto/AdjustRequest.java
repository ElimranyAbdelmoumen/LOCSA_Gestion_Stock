package com.locsa.stock.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdjustRequest {
    @NotBlank(message = "Le motif d'ajustement est obligatoire")
    private String adjustmentComment;
}
