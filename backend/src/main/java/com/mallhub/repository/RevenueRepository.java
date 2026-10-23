package com.mallhub.repository;

import com.mallhub.entity.RevenueInformation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RevenueRepository extends JpaRepository<RevenueInformation, RevenueInformation.Id> {
    Page<RevenueInformation> findByIdTenantId(Integer tenantId, Pageable pageable);

    @Query("""
            SELECT COALESCE(MAX(r.id.informationId), 0)
            FROM RevenueInformation r WHERE r.id.tenantId = :tenantId
            """)
    Integer findMaxInformationId(@Param("tenantId") Integer tenantId);
}
