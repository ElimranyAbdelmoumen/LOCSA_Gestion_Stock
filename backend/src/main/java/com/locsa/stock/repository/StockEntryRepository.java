package com.locsa.stock.repository;

import com.locsa.stock.entity.City;
import com.locsa.stock.entity.StockEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface StockEntryRepository extends JpaRepository<StockEntry, Long> {

    long countByProductId(Long productId);
    void deleteByProductId(Long productId);
    void deleteByProductIdAndCity(Long productId, City city);

    List<StockEntry> findAllByOrderByDateEntryDesc();
    List<StockEntry> findByProductIdOrderByDateEntryDesc(Long productId);
    List<StockEntry> findByProductIdAndCityOrderByDateEntryDesc(Long productId, City city);
    List<StockEntry> findTop5ByOrderByDateEntryDesc();
    List<StockEntry> findTop10ByOrderByDateEntryDesc();
    List<StockEntry> findByCreatedByOrderByDateEntryDesc(String createdBy);

    List<StockEntry> findByCityOrderByDateEntryDesc(City city);
    List<StockEntry> findByCreatedByAndCityOrderByDateEntryDesc(String createdBy, City city);

    @Query("SELECT e FROM StockEntry e WHERE e.dateEntry BETWEEN :from AND :to ORDER BY e.dateEntry ASC")
    List<StockEntry> findByPeriod(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT e FROM StockEntry e WHERE e.city = :city AND e.dateEntry BETWEEN :from AND :to ORDER BY e.dateEntry ASC")
    List<StockEntry> findByPeriodAndCity(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("city") City city);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockEntry e WHERE e.product.id = :productId AND e.city = :city")
    Long getTotalEntriesByProductAndCity(@Param("productId") Long productId, @Param("city") City city);

    /** Returns [productId, totalQuantity] for all products in a city — single batch query */
    @Query("SELECT e.product.id, COALESCE(SUM(e.quantity), 0) FROM StockEntry e WHERE e.city = :city GROUP BY e.product.id")
    List<Object[]> getTotalEntriesPerProductForCity(@Param("city") City city);

    /** Returns [productId, totalQuantity] for all products globally — single batch query */
    @Query("SELECT e.product.id, COALESCE(SUM(e.quantity), 0) FROM StockEntry e GROUP BY e.product.id")
    List<Object[]> getTotalEntriesPerProduct();

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockEntry e WHERE e.product.id = :productId")
    Long getTotalEntriesByProduct(@Param("productId") Long productId);

    /** JOIN FETCH to avoid lazy loading N+1 on product */
    @Query("SELECT e FROM StockEntry e JOIN FETCH e.product ORDER BY e.dateEntry DESC")
    List<StockEntry> findTop10WithProduct(Pageable pageable);

    @Query("SELECT e FROM StockEntry e JOIN FETCH e.product WHERE e.city = :city ORDER BY e.dateEntry DESC")
    List<StockEntry> findTop10ByCityWithProduct(@Param("city") City city, Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockEntry e WHERE e.city = :city")
    Long getTotalByCity(@Param("city") City city);

    // Pageable variants
    Page<StockEntry> findAllByOrderByDateEntryDesc(Pageable pageable);
    Page<StockEntry> findByCityOrderByDateEntryDesc(City city, Pageable pageable);
    Page<StockEntry> findByCreatedByOrderByDateEntryDesc(String createdBy, Pageable pageable);
    Page<StockEntry> findByCreatedByAndCityOrderByDateEntryDesc(String createdBy, City city, Pageable pageable);
    Page<StockEntry> findByCityAndDateEntryBetweenOrderByDateEntryDesc(City city, LocalDate from, LocalDate to, Pageable pageable);
    Page<StockEntry> findByDateEntryBetweenOrderByDateEntryDesc(LocalDate from, LocalDate to, Pageable pageable);
    Page<StockEntry> findByCreatedByAndDateEntryBetweenOrderByDateEntryDesc(String createdBy, LocalDate from, LocalDate to, Pageable pageable);
    Page<StockEntry> findByCreatedByAndCityAndDateEntryBetweenOrderByDateEntryDesc(String createdBy, City city, LocalDate from, LocalDate to, Pageable pageable);

    // Multi-city (user assigned to more than one city)
    Page<StockEntry> findByCityInOrderByDateEntryDesc(Set<City> cities, Pageable pageable);
    Page<StockEntry> findByCityInAndDateEntryBetweenOrderByDateEntryDesc(Set<City> cities, LocalDate from, LocalDate to, Pageable pageable);
}
