package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "Bid_Event")
@Getter
@Setter
@NoArgsConstructor
public class BidEvent {
    @EmbeddedId
    private Id id;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // Kept BOOLEAN per committed schema; human note derived from winning bid (see DESIGN §6-D10).
    @Column(name = "final_allocation")
    private Boolean finalAllocation;

    @Column(name = "minimum_bid_amount")
    private BigDecimal minimumBidAmount;

    @Column(name = "minimum_bid_increment")
    private BigDecimal minimumBidIncrement;

    @Column(nullable = false)
    private String status = "open";

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "store_id")
        private Integer storeId;
        @Column(name = "event_id")
        private Integer eventId;

        public Id(Integer storeId, Integer eventId) {
            this.storeId = storeId;
            this.eventId = eventId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(storeId, other.storeId) && Objects.equals(eventId, other.eventId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(storeId, eventId);
        }
    }
}
