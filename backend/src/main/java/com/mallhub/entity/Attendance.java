package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;

@Entity
@Table(name = "Attendance")
@Getter
@Setter
@NoArgsConstructor
public class Attendance {
    @EmbeddedId
    private Id id;

    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    @Column(name = "check_out_time")
    private LocalTime checkOutTime;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "employee_id")
        private Integer employeeId;
        private LocalDate date;

        public Id(Integer employeeId, LocalDate date) {
            this.employeeId = employeeId;
            this.date = date;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(employeeId, other.employeeId) && Objects.equals(date, other.date);
        }

        @Override
        public int hashCode() {
            return Objects.hash(employeeId, date);
        }
    }
}
