package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "Mall")
@Getter
@Setter
@NoArgsConstructor
public class Mall {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mall_id")
    private Integer mallId;

    @Column(name = "mall_area_sqft")
    private Double mallAreaSqft;

    @Column(name = "opening_date")
    private LocalDate openingDate;

    private String street;
    private String city;
    private String state;
    private String pincode;
    private Float latitude;
    private Float longitude;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;
}
