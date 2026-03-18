package com.locsa.stock.repository;

import com.locsa.stock.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findAllByOrderByDateInventoryDesc();

    List<Inventory> findByCreatedByOrderByDateInventoryDesc(String createdBy);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.difference < 0")
    long countNegativeGap();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.difference > 0")
    long countPositiveGap();
}
