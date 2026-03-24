package com.locsa.stock.repository;

import com.locsa.stock.entity.City;
import com.locsa.stock.entity.StockExit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface StockExitRepository extends JpaRepository<StockExit, Long> {

    long countByProductId(Long productId);

    List<StockExit> findAllByOrderByDateExitDesc();
    List<StockExit> findByProductIdOrderByDateExitDesc(Long productId);
    List<StockExit> findByProductIdAndCityOrderByDateExitDesc(Long productId, City city);
    List<StockExit> findTop5ByOrderByDateExitDesc();
    List<StockExit> findTop10ByOrderByDateExitDesc();
    List<StockExit> findByCreatedByOrderByDateExitDesc(String createdBy);

    List<StockExit> findByCityOrderByDateExitDesc(City city);
    List<StockExit> findByCreatedByAndCityOrderByDateExitDesc(String createdBy, City city);

    @Query("SELECT e FROM StockExit e WHERE e.dateExit BETWEEN :from AND :to ORDER BY e.dateExit ASC")
    List<StockExit> findByPeriod(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT e FROM StockExit e WHERE e.city = :city AND e.dateExit BETWEEN :from AND :to ORDER BY e.dateExit ASC")
    List<StockExit> findByPeriodAndCity(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("city") City city);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockExit e WHERE e.product.id = :productId AND e.city = :city")
    Long getTotalExitsByProductAndCity(@Param("productId") Long productId, @Param("city") City city);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockExit e WHERE e.product.id = :productId")
    Long getTotalExitsByProduct(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockExit e WHERE e.city = :city")
    Long getTotalByCity(@Param("city") City city);

    // Pageable variants
    Page<StockExit> findAllByOrderByDateExitDesc(Pageable pageable);
    Page<StockExit> findByCityOrderByDateExitDesc(City city, Pageable pageable);
    Page<StockExit> findByCreatedByOrderByDateExitDesc(String createdBy, Pageable pageable);
    Page<StockExit> findByCreatedByAndCityOrderByDateExitDesc(String createdBy, City city, Pageable pageable);
    Page<StockExit> findByCityAndDateExitBetweenOrderByDateExitDesc(City city, LocalDate from, LocalDate to, Pageable pageable);
    Page<StockExit> findByDateExitBetweenOrderByDateExitDesc(LocalDate from, LocalDate to, Pageable pageable);
    Page<StockExit> findByCreatedByAndDateExitBetweenOrderByDateExitDesc(String createdBy, LocalDate from, LocalDate to, Pageable pageable);
    Page<StockExit> findByCreatedByAndCityAndDateExitBetweenOrderByDateExitDesc(String createdBy, City city, LocalDate from, LocalDate to, Pageable pageable);
}
