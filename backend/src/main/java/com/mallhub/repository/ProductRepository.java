package com.mallhub.repository;

import com.mallhub.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    // (product, store) pairs already filtered by mall and toShow = true.
    @Query("""
            SELECT p, s FROM StoreProduct sp
            JOIN Product p ON p.productId = sp.id.productId
            JOIN Store s ON s.storeId = sp.id.storeId
            WHERE s.mallId = :mallId AND sp.toShow = TRUE
            """)
    List<Object[]> findTopSellingByMall(@Param("mallId") Integer mallId);
}