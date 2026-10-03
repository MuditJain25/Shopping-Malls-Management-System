package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "Leave_Request")
@Getter
@Setter
@NoArgsConstructor
public class LeaveRequest {
    @EmbeddedId
    private Id id;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String status;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "employee_id")
        private Integer employeeId;
        @Column(name = "request_id")
        private Integer requestId;

        public Id(Integer employeeId, Integer requestId) {
            this.employeeId = employeeId;
            this.requestId = requestId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id other)) return false;
            return Objects.equals(employeeId, other.employeeId) && Objects.equals(requestId, other.requestId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(employeeId, requestId);
        }
    }
}
