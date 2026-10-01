package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Store")
@Getter
@Setter
@NoArgsConstructor
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "store_id")
    private Integer storeId;

    // Shop label like 'G-12' — deliberately VARCHAR, not numeric.
    @Column(name = "shop_number", length = 20)
    private String shopNumber;

    private Integer floor;

    @Column(name = "area_sqft")
    private Double areaSqft;

    @Column(name = "store_name")
    private String storeName;

    private String status;

    // Single listing image URL (v2.1 decision: one URL, not an array).
    @Column(name = "listing_media", length = 1000)
    private String listingMedia;

    @Column(name = "mall_id", nullable = false)
    private Integer mallId;
}
