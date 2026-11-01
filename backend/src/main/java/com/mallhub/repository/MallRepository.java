package com.mallhub.repository;

import com.mallhub.entity.Mall;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MallRepository extends JpaRepository<Mall, Integer> {

    @Query("""
            SELECT m FROM Mall m
            WHERE (:city IS NULL OR LOWER(m.city) = LOWER(:city))
              AND (:q IS NULL
                   OR LOWER(m.city) LIKE CONCAT('%', LOWER(:q), '%')
                   OR LOWER(m.state) LIKE CONCAT('%', LOWER(:q), '%')
                   OR LOWER(m.description) LIKE CONCAT('%', LOWER(:q), '%'))
            """)
    Page<Mall> search(@Param("q") String q, @Param("city") String city, Pageable pageable);

    @Query("""
            SELECT DISTINCT m FROM Mall m
            JOIN Store s ON s.mallId = m.mallId
            JOIN StoreTenant st ON st.id.storeId = s.storeId
            WHERE st.id.tenantId = :tenantId
            ORDER BY m.mallId
            """)
    List<Mall> findByTenant(@Param("tenantId") Integer tenantId);

    @Query("""
            SELECT m FROM Mall m
            WHERE m.mallId IN (SELECT o.id.mallId FROM ExecutiveOverseesMall o
                               WHERE o.id.executiveId = :executiveId)
            """)
    List<Mall> findByExecutive(@Param("executiveId") Integer executiveId);

    @Query("""
            SELECT m FROM Mall m
            WHERE m.latitude IS NOT NULL AND m.longitude IS NOT NULL
            ORDER BY (m.latitude - :lat) * (m.latitude - :lat)
                   + (m.longitude - :lng) * (m.longitude - :lng)
            """)
    Page<Mall> nearest(@Param("lat") Double lat, @Param("lng") Double lng, Pageable pageable);
}