package com.locsa.stock.repository;

import com.locsa.stock.entity.StockExit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface StockExitRepository extends JpaRepository<StockExit, Long> {
    List<StockExit> findAllByOrderByDateExitDesc();
    List<StockExit> findTop5ByOrderByDateExitDesc();

    List<StockExit> findByCreatedByOrderByDateExitDesc(String createdBy);

    @Query("SELECT e FROM StockExit e WHERE e.dateExit BETWEEN :from AND :to ORDER BY e.dateExit ASC")
    List<StockExit> findByPeriod(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
