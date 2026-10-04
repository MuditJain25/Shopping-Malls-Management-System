package com.mallhub.repository;

import com.mallhub.entity.StoreProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreProductRepository extends JpaRepository<StoreProduct, StoreProduct.Id> {
    List<StoreProduct> findByIdStoreIdOrderByIdProductIdAsc(Integer storeId);
}