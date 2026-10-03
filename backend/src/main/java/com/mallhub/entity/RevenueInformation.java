package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

// Endpoints deferred (pending P2) — entity kept so the table stays managed.
@Entity
@Table(name = "Revenue_Information")
@Getter
@Setter
@NoArgsConstructor
public class RevenueInformation {
    @EmbeddedId
    private Id id;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "tenant_id")
        private Integer tenantId;
        @Column(name = "information_id")
        private Integer informationId;

        public Id(Integer tenantId, Integer informationId) {
            this.tenantId = tenantId;
            this.informationId = informationId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(tenantId, other.tenantId) && Objects.equals(informationId, other.informationId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tenantId, informationId);
        }
    }
}
