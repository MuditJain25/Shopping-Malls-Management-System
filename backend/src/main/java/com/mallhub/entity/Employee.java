package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Employee")
@Getter
@Setter
@NoArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Integer employeeId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private String email;

    @Column(name = "date_of_joining")
    private LocalDate dateOfJoining;

    @Column(name = "base_salary")
    private BigDecimal baseSalary;

    @Column(name = "current_designation")
    private String currentDesignation;

    @Column(name = "phone_number")
    private String phoneNumber;

    // Nullable: direct mall staff have no store.
    @Column(name = "store_id")
    private Integer storeId;

    @Column(name = "mall_id", nullable = false)
    private Integer mallId;
}
