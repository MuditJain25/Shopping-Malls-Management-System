package com.mallhub.repository;

import com.mallhub.entity.DiscountOffer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OfferRepository extends JpaRepository<DiscountOffer, DiscountOffer.Id> {
    List<DiscountOffer> findByIdStoreId(Integer storeId);

    Page<DiscountOffer> findByIdStoreId(Integer storeId, Pageable pageable);

    @Query("""
            SELECT o FROM DiscountOffer o
            WHERE o.id.storeId IN (SELECT s.storeId FROM Store s WHERE s.mallId = :mallId)
            """)
    Page<DiscountOffer> findByMall(@Param("mallId") Integer mallId, Pageable pageable);
}