package com.mallhub.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class MallDtos {
    private MallDtos() {
    }

    public record MallResponse(Integer mallId, Double mallAreaSqft, LocalDate openingDate,
                               String street, String city, String state, String pincode,
                               Float latitude, Float longitude, List<String> contactNumbers,
                               String imageUrl, String description) {
    }

    // listing_media is a single image URL string (DESIGN v2.1).
    public record StoreResponse(Integer storeId, String shopNumber, Integer floor,
                                Double areaSqft, String storeName, String status,
                                String listingMedia, Integer mallId) {
    }

    public record ProductResponse(Integer productId, String productName, String category,
                                  BigDecimal price, String imageUrl, Boolean toShow,
                                  StoreResponse store) {
    }

    public record OfferResponse(Integer storeId, Integer offerId, LocalDate startDate,
                                LocalDate endDate, String description) {
    }

    public record ProductCreateRequest(@NotBlank String productName, String category,
                                       @Min(0) BigDecimal price, String imageUrl) {
    }

    public record OfferCreateRequest(LocalDate startDate, LocalDate endDate,
                                     @NotBlank String description) {
    }

    public record VisibilityRequest(Boolean toShow) {
    }
}
