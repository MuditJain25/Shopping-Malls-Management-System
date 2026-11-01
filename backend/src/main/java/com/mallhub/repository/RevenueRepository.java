package com.mallhub.repository;

import com.mallhub.entity.RevenueInformation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RevenueRepository extends JpaRepository<RevenueInformation, RevenueInformation.Id> {
    Page<RevenueInformation> findByIdTenantId(Integer tenantId, Pageable pageable);

    // Explicit (tenant, information) order so pages never overlap; the Pageable's own sort is appended after it.
    @Query("SELECT r FROM RevenueInformation r ORDER BY r.id.tenantId, r.id.informationId")
    Page<RevenueInformation> findAllOrdered(Pageable pageable);

    @Query("""
            SELECT r FROM RevenueInformation r
            WHERE r.id.tenantId IN (SELECT st.id.tenantId FROM StoreTenant st
                                    JOIN Store s ON s.storeId = st.id.storeId
                                    WHERE s.mallId = :mallId)
            ORDER BY r.id.tenantId, r.id.informationId
            """)
    Page<RevenueInformation> findByMall(@Param("mallId") Integer mallId, Pageable pageable);

    @Query("""
            SELECT COALESCE(MAX(r.id.informationId), 0)
            FROM RevenueInformation r WHERE r.id.tenantId = :tenantId
            """)
    Integer findMaxInformationId(@Param("tenantId") Integer tenantId);
}
