package com.locsa.stock.service;

import com.locsa.stock.dto.PageResponse;
import com.locsa.stock.dto.StockExitRequest;
import com.locsa.stock.dto.StockExitResponse;
import com.locsa.stock.entity.City;
import com.locsa.stock.entity.Product;
import com.locsa.stock.entity.Site;
import com.locsa.stock.entity.StockExit;
import com.locsa.stock.repository.ProductRepository;
import com.locsa.stock.repository.SiteRepository;
import com.locsa.stock.repository.StockEntryRepository;
import com.locsa.stock.repository.StockExitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockExitService {

    private final StockExitRepository stockExitRepository;
    private final StockEntryRepository stockEntryRepository;
    private final ProductRepository productRepository;
    private final SiteRepository siteRepository;
    private final ReferenceService referenceService;
    private final AuditService auditService;

    public PageResponse<StockExitResponse> getAllExits(String username, boolean isAdmin, City city, LocalDate dateFrom, LocalDate dateTo, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StockExit> result;
        boolean hasDateFilter = dateFrom != null && dateTo != null;
        if (city != null) {
            if (hasDateFilter) {
                result = isAdmin
                    ? stockExitRepository.findByCityAndDateExitBetweenOrderByDateExitDesc(city, dateFrom, dateTo, pageable)
                    : stockExitRepository.findByCreatedByAndCityAndDateExitBetweenOrderByDateExitDesc(username, city, dateFrom, dateTo, pageable);
            } else {
                result = isAdmin
                    ? stockExitRepository.findByCityOrderByDateExitDesc(city, pageable)
                    : stockExitRepository.findByCreatedByAndCityOrderByDateExitDesc(username, city, pageable);
            }
        } else {
            if (hasDateFilter) {
                result = isAdmin
                    ? stockExitRepository.findByDateExitBetweenOrderByDateExitDesc(dateFrom, dateTo, pageable)
                    : stockExitRepository.findByCreatedByAndDateExitBetweenOrderByDateExitDesc(username, dateFrom, dateTo, pageable);
            } else {
                result = isAdmin
                    ? stockExitRepository.findAllByOrderByDateExitDesc(pageable)
                    : stockExitRepository.findByCreatedByOrderByDateExitDesc(username, pageable);
            }
        }
        return PageResponse.of(result, result.getContent().stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @Transactional
    public StockExitResponse createExit(StockExitRequest request, String username, City forcedCity) {
        // Pessimistic lock to prevent concurrent over-withdrawal on same product
        Product product = productRepository.findByIdWithLock(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        City city = forcedCity != null ? forcedCity : request.getCity();
        if (city == null) throw new RuntimeException("La ville est requise");

        // Resolve site for category B
        Site siteEntity = null;
        if (request.getSiteId() != null) {
            siteEntity = siteRepository.findById(request.getSiteId())
                    .orElseThrow(() -> new RuntimeException("Site introuvable"));
            if (siteEntity.getCity() != null && siteEntity.getCity() != city) {
                throw new RuntimeException(
                    "Le site \"" + siteEntity.getName() + "\" n'appartient pas à la ville sélectionnée"
                );
            }
            if (!siteEntity.isActive()) {
                throw new RuntimeException("Le site \"" + siteEntity.getName() + "\" est inactif");
            }
        }

        // Determine beneficiary
        String beneficiary = request.getBeneficiary();
        boolean isCatB = product.getCategory() != null
                && product.getCategory() == com.locsa.stock.entity.Category.B;
        if (isCatB) {
            String gasoilType = request.getGasoilType();
            if (gasoilType == null || gasoilType.isBlank()) {
                throw new RuntimeException("Veuillez sélectionner le type de gasoil (GE ou Véhicule)");
            }
            if ("GE".equals(gasoilType)) {
                if (siteEntity == null) throw new RuntimeException("Le site de destination est requis pour Gasoil GE");
                if (beneficiary == null || beneficiary.isBlank()) {
                    beneficiary = siteEntity.getName();
                }
            } else if ("VEHICULE".equals(gasoilType)) {
                if (request.getImmatriculation() == null || request.getImmatriculation().isBlank()) {
                    throw new RuntimeException("L'immatriculation du véhicule est requise");
                }
                if (beneficiary == null || beneficiary.isBlank()) {
                    beneficiary = request.getImmatriculation();
                }
            } else {
                throw new RuntimeException("Type de gasoil invalide. Valeurs acceptées : GE, VEHICULE");
            }
        } else {
            if (beneficiary == null || beneficiary.isBlank()) {
                throw new RuntimeException("Le bénéficiaire est requis");
            }
        }

        // Validate against per-city stock
        Long cityEntries = stockEntryRepository.getTotalEntriesByProductAndCity(product.getId(), city);
        Long cityExits   = stockExitRepository.getTotalExitsByProductAndCity(product.getId(), city);
        Long cityStock   = cityEntries - cityExits;

        if (cityStock < request.getQuantity()) {
            throw new RuntimeException(
                "Stock insuffisant à " + city.name().charAt(0) + city.name().substring(1).toLowerCase()
                + ". Disponible : " + cityStock + ", Demandé : " + request.getQuantity()
            );
        }

        StockExit exit = StockExit.builder()
                .product(product)
                .dateExit(request.getDateExit())
                .quantity(request.getQuantity())
                .beneficiary(beneficiary)
                .comment(request.getComment())
                .createdBy(username)
                .city(city)
                .site(siteEntity)
                .code(request.getCode())
                .serialNumber(request.getSerialNumber())
                .gasoilType(request.getGasoilType())
                .immatriculation(request.getImmatriculation())
                .reference(referenceService.generateReference("SOR"))
                .build();

        exit = stockExitRepository.save(exit);
        product.setQuantity(product.getQuantity() - request.getQuantity());
        productRepository.save(product);

        auditService.log("STOCK_EXIT", exit.getId(), "CREATE", username, "Sortie: " + exit.getProduct().getName() + " qté=" + exit.getQuantity() + " ville=" + city, city);

        return toResponse(exit);
    }

    public StockExitResponse toResponse(StockExit exit) {
        String cat = exit.getProduct().getCategory() != null
                ? exit.getProduct().getCategory().name() : "C";
        return new StockExitResponse(
                exit.getId(),
                exit.getProduct().getName(),
                exit.getDateExit(),
                exit.getQuantity(),
                exit.getBeneficiary(),
                exit.getComment(),
                exit.getCreatedBy(),
                exit.getCity(),
                cat,
                exit.getSite() != null ? exit.getSite().getName() : null,
                exit.getGasoilType(),
                exit.getImmatriculation(),
                exit.getCode(),
                exit.getSerialNumber(),
                exit.getReference()
        );
    }

    public List<StockExitResponse> getRecentExits() {
        return stockExitRepository.findTop5ByOrderByDateExitDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
