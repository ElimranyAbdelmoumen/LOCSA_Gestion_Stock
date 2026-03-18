package com.locsa.stock.service;

import com.locsa.stock.dto.StockExitRequest;
import com.locsa.stock.dto.StockExitResponse;
import com.locsa.stock.entity.Product;
import com.locsa.stock.entity.StockExit;
import com.locsa.stock.repository.ProductRepository;
import com.locsa.stock.repository.StockExitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockExitService {

    private final StockExitRepository stockExitRepository;
    private final ProductRepository productRepository;

    public List<StockExitResponse> getAllExits(String username, boolean isAdmin) {
        List<StockExit> exits = isAdmin
                ? stockExitRepository.findAllByOrderByDateExitDesc()
                : stockExitRepository.findByCreatedByOrderByDateExitDesc(username);
        return exits.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public StockExitResponse createExit(StockExitRequest request, String username) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        if (product.getQuantity() < request.getQuantity()) {
            throw new RuntimeException(
                "Stock insuffisant. Disponible : " + product.getQuantity() +
                ", Demandé : " + request.getQuantity()
            );
        }

        StockExit exit = StockExit.builder()
                .product(product)
                .dateExit(request.getDateExit())
                .quantity(request.getQuantity())
                .beneficiary(request.getBeneficiary())
                .comment(request.getComment())
                .createdBy(username)
                .build();

        stockExitRepository.save(exit);
        product.setQuantity(product.getQuantity() - request.getQuantity());
        productRepository.save(product);

        return toResponse(exit);
    }

    public StockExitResponse toResponse(StockExit exit) {
        return new StockExitResponse(
                exit.getId(),
                exit.getProduct().getName(),
                exit.getDateExit(),
                exit.getQuantity(),
                exit.getBeneficiary(),
                exit.getComment(),
                exit.getCreatedBy()
        );
    }

    public List<StockExitResponse> getRecentExits() {
        return stockExitRepository.findTop5ByOrderByDateExitDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
