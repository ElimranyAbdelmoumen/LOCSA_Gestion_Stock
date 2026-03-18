package com.locsa.stock.repository;

import com.locsa.stock.entity.StockEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface StockEntryRepository extends JpaRepository<StockEntry, Long> {
    List<StockEntry> findAllByOrderByDateEntryDesc();
    List<StockEntry> findTop5ByOrderByDateEntryDesc();

    List<StockEntry> findByCreatedByOrderByDateEntryDesc(String createdBy);

    @Query("SELECT e FROM StockEntry e WHERE e.dateEntry BETWEEN :from AND :to ORDER BY e.dateEntry ASC")
    List<StockEntry> findByPeriod(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
