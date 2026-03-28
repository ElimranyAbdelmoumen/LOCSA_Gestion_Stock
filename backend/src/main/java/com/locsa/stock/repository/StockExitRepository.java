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
import java.util.Set;

public interface StockExitRepository extends JpaRepository<StockExit, Long> {

    long countByProductId(Long productId);
    void deleteByProductId(Long productId);
    void deleteByProductIdAndCity(Long productId, City city);

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

    /** Returns [productId, totalQuantity] for all products in a city — single batch query */
    @Query("SELECT e.product.id, COALESCE(SUM(e.quantity), 0) FROM StockExit e WHERE e.city = :city GROUP BY e.product.id")
    List<Object[]> getTotalExitsPerProductForCity(@Param("city") City city);

    /** Returns [productId, totalQuantity] for all products globally — single batch query */
    @Query("SELECT e.product.id, COALESCE(SUM(e.quantity), 0) FROM StockExit e GROUP BY e.product.id")
    List<Object[]> getTotalExitsPerProduct();

    @Query("SELECT COALESCE(SUM(e.quantity), 0) FROM StockExit e WHERE e.product.id = :productId")
    Long getTotalExitsByProduct(@Param("productId") Long productId);

    /** JOIN FETCH to avoid lazy loading N+1 on product */
    @Query("SELECT e FROM StockExit e JOIN FETCH e.product ORDER BY e.dateExit DESC")
    List<StockExit> findTop10WithProduct(Pageable pageable);

    @Query("SELECT e FROM StockExit e JOIN FETCH e.product WHERE e.city = :city ORDER BY e.dateExit DESC")
    List<StockExit> findTop10ByCityWithProduct(@Param("city") City city, Pageable pageable);

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

    // Multi-city (user assigned to more than one city)
    Page<StockExit> findByCityInOrderByDateExitDesc(Set<City> cities, Pageable pageable);
    Page<StockExit> findByCityInAndDateExitBetweenOrderByDateExitDesc(Set<City> cities, LocalDate from, LocalDate to, Pageable pageable);
}
