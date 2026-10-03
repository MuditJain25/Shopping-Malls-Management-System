package com.mallhub.repository;

import com.mallhub.entity.DiscountOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<DiscountOffer, DiscountOffer.Id> {
    List<DiscountOffer> findByIdStoreId(Integer storeId);
}
