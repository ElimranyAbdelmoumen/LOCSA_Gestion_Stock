package com.locsa.stock.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class InventoryRequest {

    @NotBlank(message = "Le nom du produit est requis")
    private String productName;

    @NotNull(message = "La quantité réelle est requise")
    @Min(value = 0, message = "La quantité ne peut pas être négative")
    private Long realQuantity;

    private String comment;

    private LocalDate dateInventory;
}
