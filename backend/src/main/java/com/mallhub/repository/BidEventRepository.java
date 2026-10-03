package com.mallhub.repository;

import com.mallhub.entity.BidEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BidEventRepository extends JpaRepository<BidEvent, BidEvent.Id> {
    List<BidEvent> findByIdStoreId(Integer storeId);
    List<BidEvent> findByIdEventId(Integer eventId);
    List<BidEvent> findByStatus(String status);

    // Row lock for the place-bid race (two bids at the same minimum).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from BidEvent e where e.id.storeId = :storeId and e.id.eventId = :eventId")
    Optional<BidEvent> findForUpdate(Integer storeId, Integer eventId);
}
