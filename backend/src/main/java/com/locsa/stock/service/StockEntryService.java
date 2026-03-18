package com.locsa.stock.service;

import com.locsa.stock.dto.StockEntryRequest;
import com.locsa.stock.dto.StockEntryResponse;
import com.locsa.stock.entity.Product;
import com.locsa.stock.entity.StockEntry;
import com.locsa.stock.repository.ProductRepository;
import com.locsa.stock.repository.StockEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockEntryService {

    private final StockEntryRepository stockEntryRepository;
    private final ProductRepository productRepository;

    public List<StockEntryResponse> getAllEntries(String username, boolean isAdmin) {
        List<StockEntry> entries = isAdmin
                ? stockEntryRepository.findAllByOrderByDateEntryDesc()
                : stockEntryRepository.findByCreatedByOrderByDateEntryDesc(username);
        return entries.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public StockEntryResponse createEntry(StockEntryRequest request, String username) {
        String name = request.getProductName().trim();
        Product product = productRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> productRepository.save(
                        Product.builder().name(name).description("").quantity(0L).build()
                ));

        StockEntry entry = StockEntry.builder()
                .product(product)
                .dateEntry(request.getDateEntry())
                .quantity(request.getQuantity())
                .comment(request.getComment())
                .createdBy(username)
                .build();

        stockEntryRepository.save(entry);
        product.setQuantity(product.getQuantity() + request.getQuantity());
        productRepository.save(product);

        return toResponse(entry);
    }

    public StockEntryResponse toResponse(StockEntry entry) {
        return new StockEntryResponse(
                entry.getId(),
                entry.getProduct().getName(),
                entry.getDateEntry(),
                entry.getQuantity(),
                entry.getComment(),
                entry.getCreatedBy()
        );
    }

    public List<StockEntryResponse> getRecentEntries() {
        return stockEntryRepository.findTop5ByOrderByDateEntryDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
