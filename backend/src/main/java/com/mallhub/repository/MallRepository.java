package com.mallhub.repository;

import com.mallhub.entity.Mall;
import org.springframework.data.domain.Sort;
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
    List<Mall> search(@Param("q") String q, @Param("city") String city, Sort sort);

    @Query("""
            SELECT m FROM Mall m
            WHERE m.mallId IN (SELECT o.id.mallId FROM ExecutiveOverseesMall o
                               WHERE o.id.executiveId = :executiveId)
            """)
    List<Mall> findByExecutive(@Param("executiveId") Integer executiveId);
}