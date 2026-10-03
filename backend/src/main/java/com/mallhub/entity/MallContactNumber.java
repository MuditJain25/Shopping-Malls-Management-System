package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "Mall_Contact_Number")
@Getter
@Setter
@NoArgsConstructor
public class MallContactNumber {
    @EmbeddedId
    private Id id;

    public MallContactNumber(Integer mallId, String contactNumber) {
        this.id = new Id(mallId, contactNumber);
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "mall_id")
        private Integer mallId;
        @Column(name = "contact_number")
        private String contactNumber;

        public Id(Integer mallId, String contactNumber) {
            this.mallId = mallId;
            this.contactNumber = contactNumber;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(mallId, other.mallId) && Objects.equals(contactNumber, other.contactNumber);
        }

        @Override
        public int hashCode() {
            return Objects.hash(mallId, contactNumber);
        }
    }
}
