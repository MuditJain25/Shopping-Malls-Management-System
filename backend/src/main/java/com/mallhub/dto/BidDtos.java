package com.mallhub.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class BidDtos {
    private BidDtos() {
    }

    public record BidResponse(Integer userId, Integer bidId, Integer eventId, Integer storeId,
                              BigDecimal bidAmount, Integer roundNumber, LocalDateTime bidDate,
                              String status, String bidderName) {
    }

    public record BidEventResponse(Integer storeId, Integer eventId, LocalDate startDate,
                                   LocalDate endDate, String status,
                                   BigDecimal minimumBidAmount, BigDecimal minimumBidIncrement,
                                   Boolean finalAllocation, BidResponse winningBid) {
    }

    public record PlaceBidRequest(@NotNull Integer userId, @NotNull @Min(1) BigDecimal bidAmount,
                                  String bidderName) {
    }

    // Accepted but NOT persisted until the final_allocation VARCHAR migration (DESIGN §6-D10).
    public record FinalizeRequest(String finalAllocation) {
    }
}
