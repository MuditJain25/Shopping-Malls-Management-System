package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "Mall_Manager")
@Getter
@Setter
@NoArgsConstructor
public class MallManager {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "manager_id")
    private Integer managerId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    private String email;

    @Column(name = "date_joined")
    private LocalDate dateJoined;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "mall_id", nullable = false)
    private Integer mallId;
}
