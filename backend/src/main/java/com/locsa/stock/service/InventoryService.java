package com.locsa.stock.service;

import com.locsa.stock.dto.InventoryRequest;
import com.locsa.stock.dto.InventoryResponse;
import com.locsa.stock.entity.Inventory;
import com.locsa.stock.entity.Product;
import com.locsa.stock.repository.InventoryRepository;
import com.locsa.stock.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public InventoryResponse createInventory(InventoryRequest request, String username) {
        Product product = productRepository.findByNameIgnoreCase(request.getProductName().trim())
                .orElseThrow(() -> new RuntimeException("Produit introuvable : " + request.getProductName()));

        long systemQty = product.getQuantity();
        long realQty = request.getRealQuantity();
        long difference = realQty - systemQty;

        Inventory inventory = Inventory.builder()
                .product(product)
                .systemQuantity(systemQty)
                .realQuantity(realQty)
                .difference(difference)
                .dateInventory(request.getDateInventory() != null ? request.getDateInventory() : LocalDate.now())
                .comment(request.getComment())
                .createdBy(username)
                .build();

        return toResponse(inventoryRepository.save(inventory));
    }

    public List<InventoryResponse> getAllInventories(String username, boolean isAdmin) {
        List<Inventory> list = isAdmin
                ? inventoryRepository.findAllByOrderByDateInventoryDesc()
                : inventoryRepository.findByCreatedByOrderByDateInventoryDesc(username);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponse adjustStock(Long id, String adjustmentComment) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventaire introuvable"));

        Product product = inventory.getProduct();
        product.setQuantity(inventory.getRealQuantity());
        productRepository.save(product);

        inventory.setSystemQuantity(inventory.getRealQuantity());
        inventory.setDifference(0L);
        inventory.setAdjustmentComment(adjustmentComment);
        return toResponse(inventoryRepository.save(inventory));
    }

    public InventoryResponse toResponse(Inventory inv) {
        return new InventoryResponse(
                inv.getId(),
                inv.getProduct().getName(),
                inv.getSystemQuantity(),
                inv.getRealQuantity(),
                inv.getDifference(),
                inv.getDateInventory(),
                inv.getComment(),
                inv.getAdjustmentComment(),
                inv.getCreatedBy()
        );
    }

    public long countNegativeGap() {
        return inventoryRepository.countNegativeGap();
    }

    public long countPositiveGap() {
        return inventoryRepository.countPositiveGap();
    }
}
