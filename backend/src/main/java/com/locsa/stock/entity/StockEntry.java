package com.locsa.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "stock_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDate dateEntry;

    @Column(nullable = false)
    private Long quantity;

    @Column(length = 500)
    private String comment;

    @Column(nullable = false)
    private String createdBy;
}
