package com.mallhub.repository;

import com.mallhub.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Integer> {

    Page<Store> findByMallId(Integer mallId, Pageable pageable);

    Page<Store> findByMallIdAndStatus(Integer mallId, String status, Pageable pageable);

    Page<Store> findByStatus(String status, Pageable pageable);

    @Query("""
            SELECT s FROM Store s
            JOIN StoreTenant st ON st.id.storeId = s.storeId
            WHERE st.id.tenantId = :tenantId
            """)
    List<Store> findByTenant(@Param("tenantId") Integer tenantId);
}