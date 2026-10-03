package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "Store_Sells_Product")
@Getter
@Setter
@NoArgsConstructor
public class StoreProduct {
    @EmbeddedId
    private Id id;

    @Column(name = "to_show", nullable = false)
    private Boolean toShow = false;

    public StoreProduct(Integer storeId, Integer productId, Boolean toShow) {
        this.id = new Id(storeId, productId);
        this.toShow = toShow;
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "store_id")
        private Integer storeId;
        @Column(name = "product_id")
        private Integer productId;

        public Id(Integer storeId, Integer productId) {
            this.storeId = storeId;
            this.productId = productId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(storeId, other.storeId) && Objects.equals(productId, other.productId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(storeId, productId);
        }
    }
}
