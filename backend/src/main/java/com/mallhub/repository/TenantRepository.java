package com.mallhub.repository;

import com.mallhub.entity.Tenant;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Integer> {
    Optional<Tenant> findByEmail(String email);

    @Query("""
            SELECT DISTINCT t FROM Tenant t
            JOIN StoreTenant st ON st.id.tenantId = t.tenantId
            JOIN Store s ON s.storeId = st.id.storeId
            WHERE s.mallId = :mallId
            """)
    List<Tenant> findByMall(@Param("mallId") Integer mallId, Sort sort);
}