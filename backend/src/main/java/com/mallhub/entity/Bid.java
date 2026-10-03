package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "Bid")
@Getter
@Setter
@NoArgsConstructor
public class Bid {
    @EmbeddedId
    private Id id;

    @Column(name = "event_id")
    private Integer eventId;

    @Column(name = "store_id")
    private Integer storeId;

    @Column(name = "bid_amount")
    private BigDecimal bidAmount;

    @Column(name = "round_number")
    private Integer roundNumber;

    @Column(name = "bid_date")
    private LocalDateTime bidDate;

    private String status;

    @Column(name = "bidder_name")
    private String bidderName;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "user_id")
        private Integer userId;
        @Column(name = "bid_id")
        private Integer bidId;

        public Id(Integer userId, Integer bidId) {
            this.userId = userId;
            this.bidId = bidId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(userId, other.userId) && Objects.equals(bidId, other.bidId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, bidId);
        }
    }
}
