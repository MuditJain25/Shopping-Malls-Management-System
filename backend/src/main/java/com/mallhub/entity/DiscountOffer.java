package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "Discount_Offer")
@Getter
@Setter
@NoArgsConstructor
public class DiscountOffer {
    @EmbeddedId
    private Id id;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "store_id")
        private Integer storeId;
        @Column(name = "offer_id")
        private Integer offerId;

        public Id(Integer storeId, Integer offerId) {
            this.storeId = storeId;
            this.offerId = offerId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(storeId, other.storeId) && Objects.equals(offerId, other.offerId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(storeId, offerId);
        }
    }
}
