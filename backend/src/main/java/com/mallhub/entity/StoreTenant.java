package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "Store_Rented_By_Tenant")
@Getter
@Setter
@NoArgsConstructor
public class StoreTenant {
    @EmbeddedId
    private Id id;

    public StoreTenant(Integer storeId, Integer tenantId) {
        this.id = new Id(storeId, tenantId);
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "store_id")
        private Integer storeId;
        @Column(name = "tenant_id")
        private Integer tenantId;

        public Id(Integer storeId, Integer tenantId) {
            this.storeId = storeId;
            this.tenantId = tenantId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(storeId, other.storeId) && Objects.equals(tenantId, other.tenantId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(storeId, tenantId);
        }
    }
}
