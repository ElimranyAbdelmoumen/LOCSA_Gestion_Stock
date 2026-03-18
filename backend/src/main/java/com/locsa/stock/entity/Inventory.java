package com.locsa.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "inventories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Long systemQuantity;

    @Column(nullable = false)
    private Long realQuantity;

    @Column(nullable = false)
    private Long difference;

    @Column(nullable = false)
    private LocalDate dateInventory;

    private String comment;

    private String adjustmentComment;

    @Column(nullable = false)
    private String createdBy;
}
