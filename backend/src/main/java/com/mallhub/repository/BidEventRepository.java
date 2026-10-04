package com.mallhub.repository;

import com.mallhub.entity.BidEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BidEventRepository extends JpaRepository<BidEvent, BidEvent.Id> {
    List<BidEvent> findByIdEventId(Integer eventId);

    @Query("SELECT e FROM BidEvent e WHERE (:status IS NULL OR LOWER(e.status) = LOWER(:status))")
    Page<BidEvent> findByStatus(@Param("status") String status, Pageable pageable);

    @Query("""
            SELECT e FROM BidEvent e
            WHERE e.id.storeId IN (SELECT s.storeId FROM Store s WHERE s.mallId = :mallId)
              AND (:status IS NULL OR LOWER(e.status) = LOWER(:status))
            """)
    Page<BidEvent> findByMallAndStatus(@Param("mallId") Integer mallId,
                                       @Param("status") String status, Pageable pageable);

    // Row lock for the place-bid race (two bids at the same minimum).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from BidEvent e where e.id.storeId = :storeId and e.id.eventId = :eventId")
    Optional<BidEvent> findForUpdate(Integer storeId, Integer eventId);
}