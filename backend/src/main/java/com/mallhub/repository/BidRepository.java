package com.mallhub.repository;

import com.mallhub.entity.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Bid.Id> {
    Page<Bid> findByEventIdAndStoreIdOrderByRoundNumberAsc(Integer eventId, Integer storeId,
                                                          Pageable pageable);

    Page<Bid> findByIdUserId(Integer userId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM Bid b WHERE b.storeId = :storeId")
    int deleteByStoreId(@Param("storeId") Integer storeId);

    Optional<Bid> findByEventIdAndStoreIdAndStatus(Integer eventId, Integer storeId, String status);

    int countByEventIdAndStoreId(Integer eventId, Integer storeId);

    // Batches the winning-bid lookup for a whole page of events (at most one winner per event).
    List<Bid> findByStatusAndEventIdIn(String status, List<Integer> eventIds);
}