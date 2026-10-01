package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "EE_Oversees_Mall")
@Getter
@Setter
@NoArgsConstructor
public class ExecutiveOverseesMall {
    @EmbeddedId
    private Id id;

    public ExecutiveOverseesMall(Integer executiveId, Integer mallId) {
        this.id = new Id(executiveId, mallId);
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "executive_id")
        private Integer executiveId;
        @Column(name = "mall_id")
        private Integer mallId;

        public Id(Integer executiveId, Integer mallId) {
            this.executiveId = executiveId;
            this.mallId = mallId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(executiveId, other.executiveId) && Objects.equals(mallId, other.mallId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(executiveId, mallId);
        }
    }
}
