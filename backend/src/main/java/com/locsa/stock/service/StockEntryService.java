package com.locsa.stock.service;

import com.locsa.stock.dto.PageResponse;
import com.locsa.stock.dto.StockEntryRequest;
import com.locsa.stock.dto.StockEntryResponse;
import com.locsa.stock.entity.City;
import com.locsa.stock.entity.Product;
import com.locsa.stock.entity.StockEntry;
import com.locsa.stock.repository.ProductRepository;
import com.locsa.stock.repository.StockEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockEntryService {

    private final StockEntryRepository stockEntryRepository;
    private final ProductRepository productRepository;
    private final ReferenceService referenceService;
    private final AuditService auditService;

    public PageResponse<StockEntryResponse> getAllEntries(String username, boolean isAdmin, City city, LocalDate dateFrom, LocalDate dateTo, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<StockEntry> result;
        boolean hasDateFilter = dateFrom != null && dateTo != null;
        if (city != null) {
            if (hasDateFilter) {
                result = isAdmin
                    ? stockEntryRepository.findByCityAndDateEntryBetweenOrderByDateEntryDesc(city, dateFrom, dateTo, pageable)
                    : stockEntryRepository.findByCreatedByAndCityAndDateEntryBetweenOrderByDateEntryDesc(username, city, dateFrom, dateTo, pageable);
            } else {
                result = isAdmin
                    ? stockEntryRepository.findByCityOrderByDateEntryDesc(city, pageable)
                    : stockEntryRepository.findByCreatedByAndCityOrderByDateEntryDesc(username, city, pageable);
            }
        } else {
            if (hasDateFilter) {
                result = isAdmin
                    ? stockEntryRepository.findByDateEntryBetweenOrderByDateEntryDesc(dateFrom, dateTo, pageable)
                    : stockEntryRepository.findByCreatedByAndDateEntryBetweenOrderByDateEntryDesc(username, dateFrom, dateTo, pageable);
            } else {
                result = isAdmin
                    ? stockEntryRepository.findAllByOrderByDateEntryDesc(pageable)
                    : stockEntryRepository.findByCreatedByOrderByDateEntryDesc(username, pageable);
            }
        }
        return PageResponse.of(result, result.getContent().stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @Transactional
    public StockEntryResponse createEntry(StockEntryRequest request, String username, City forcedCity) {
        City city = forcedCity != null ? forcedCity : request.getCity();
        if (city == null) throw new RuntimeException("La ville est requise");

        com.locsa.stock.entity.Category cat = request.getCategory() != null
                ? request.getCategory() : com.locsa.stock.entity.Category.C;

        String name = request.getProductName().trim();
        Product product = productRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> productRepository.save(
                        Product.builder().name(name).description("").quantity(0L).category(cat).build()
                ));

        StockEntry entry = StockEntry.builder()
                .product(product)
                .dateEntry(request.getDateEntry())
                .quantity(request.getQuantity())
                .comment(request.getComment())
                .createdBy(username)
                .city(city)
                .station(request.getStation())
                .code(request.getCode())
                .serialNumber(request.getSerialNumber())
                .brand(request.getBrand())
                .power(request.getPower())
                .reference(referenceService.generateReference("ENT"))
                .build();

        entry = stockEntryRepository.save(entry);
        product.setQuantity(product.getQuantity() + request.getQuantity());
        productRepository.save(product);

        auditService.log("STOCK_ENTRY", entry.getId(), "CREATE", username, "Entrée: " + entry.getProduct().getName() + " qté=" + entry.getQuantity() + " ville=" + city, city);

        return toResponse(entry);
    }

    public StockEntryResponse toResponse(StockEntry entry) {
        String cat = entry.getProduct().getCategory() != null
                ? entry.getProduct().getCategory().name() : "C";
        return new StockEntryResponse(
                entry.getId(),
                entry.getProduct().getName(),
                entry.getDateEntry(),
                entry.getQuantity(),
                entry.getComment(),
                entry.getCreatedBy(),
                entry.getCity(),
                cat,
                entry.getStation(),
                entry.getCode(),
                entry.getSerialNumber(),
                entry.getBrand(),
                entry.getPower(),
                entry.getReference(),
                entry.getCreatedAt()
        );
    }

    @Transactional
    public void cancelEntry(Long id, String username) {
        StockEntry entry = stockEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entrée introuvable"));
        Product product = entry.getProduct();
        product.setQuantity(product.getQuantity() - entry.getQuantity());
        productRepository.save(product);
        auditService.log("STOCK_ENTRY", id, "CANCEL", username,
                "Annulation entrée: " + product.getName() + " qté=" + entry.getQuantity() + " ref=" + entry.getReference(), entry.getCity());
        stockEntryRepository.deleteById(id);
    }

    public List<StockEntryResponse> getRecentEntries() {
        return stockEntryRepository.findTop5ByOrderByDateEntryDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
