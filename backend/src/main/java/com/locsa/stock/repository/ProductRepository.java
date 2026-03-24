package com.locsa.stock.repository;

import com.locsa.stock.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByNameIgnoreCase(String name);

    /** Pessimistic write lock — prevents concurrent stock over-withdrawal */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT p FROM Product p WHERE p.minQuantity > 0 AND p.quantity <= p.minQuantity")
    List<Product> findLowStockProducts();

    @Query("SELECT SUM(p.quantity) FROM Product p")
    Long getTotalStock();
}
