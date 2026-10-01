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
@Table(name = "Payroll_Record")
@Getter
@Setter
@NoArgsConstructor
public class PayrollRecord {
    @EmbeddedId
    private Id id;

    private BigDecimal amount;

    @Column(name = "record_type")
    private String recordType;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "employee_id")
        private Integer employeeId;
        @Column(name = "record_id")
        private Integer recordId;

        public Id(Integer employeeId, Integer recordId) {
            this.employeeId = employeeId;
            this.recordId = recordId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(employeeId, other.employeeId) && Objects.equals(recordId, other.recordId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(employeeId, recordId);
        }
    }
}
