package com.mallhub.repository;

import com.mallhub.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Bid.Id> {
    List<Bid> findByEventIdAndStoreIdOrderByRoundNumberAsc(Integer eventId, Integer storeId);
    Optional<Bid> findByEventIdAndStoreIdAndStatus(Integer eventId, Integer storeId, String status);
    int countByEventIdAndStoreId(Integer eventId, Integer storeId);
}
