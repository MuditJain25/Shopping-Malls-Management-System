package com.mallhub.service;

import com.mallhub.dto.BidDtos;
import com.mallhub.entity.Bid;
import com.mallhub.entity.BidEvent;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.BidEventRepository;
import com.mallhub.repository.BidRepository;
import com.mallhub.repository.StoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class BidService {
    private final BidEventRepository events;
    private final BidRepository bids;
    private final StoreRepository stores;

    public BidService(BidEventRepository events, BidRepository bids, StoreRepository stores) {
        this.events = events;
        this.bids = bids;
        this.stores = stores;
    }

    public List<BidDtos.BidEventResponse> list(Integer mallId, String status) {
        List<BidEvent> all = events.findAll();
        if (mallId != null) {
            List<Integer> storeIds = stores.findByMallId(mallId).stream()
                    .map(com.mallhub.entity.Store::getStoreId).toList();
            all = all.stream().filter(e -> storeIds.contains(e.getId().getStoreId())).toList();
        }
        if (status != null) {
            all = all.stream().filter(e -> status.equalsIgnoreCase(e.getStatus())).toList();
        }
        return all.stream()
                .sorted(Comparator.comparing(e -> e.getId().getEventId()))
                .map(this::toResponse).toList();
    }

    public BidDtos.BidEventResponse get(Integer eventId) {
        return toResponse(requireByEventId(eventId));
    }

    public List<BidDtos.BidResponse> bidsByEvent(Integer eventId) {
        BidEvent e = requireByEventId(eventId);
        return bids.findByEventIdAndStoreIdOrderByRoundNumberAsc(
                e.getId().getEventId(), e.getId().getStoreId()).stream().map(BidService::toResponse).toList();
    }

    // Single global lookup: seed assigns unique event_ids, so exactly one row matches.
    BidEvent requireByEventId(Integer eventId) {
        List<BidEvent> found = events.findByIdEventId(eventId);
        if (found.isEmpty()) throw ApiException.notFound("Bid event");
        if (found.size() > 1) throw ApiException.conflict("Duplicate event_id; use store-scoped lookup");
        return found.get(0);
    }

    @Transactional
    public BidDtos.BidResponse placeBid(Integer eventId, BidDtos.PlaceBidRequest req) {
        BidEvent ref = requireByEventId(eventId);
        BidEvent event = events.findForUpdate(ref.getId().getStoreId(), ref.getId().getEventId())
                .orElseThrow(() -> ApiException.notFound("Bid event"));
        if (!"open".equalsIgnoreCase(event.getStatus())) {
            throw ApiException.conflict("Bidding is closed for this event");
        }
        BigDecimal highest = bids.findByEventIdAndStoreIdAndStatus(
                        event.getId().getEventId(), event.getId().getStoreId(), "winning")
                .map(Bid::getBidAmount).orElse(event.getMinimumBidAmount());
        BigDecimal minimumNext = highest.add(event.getMinimumBidIncrement());
        if (req.bidAmount().compareTo(minimumNext) < 0) {
            throw ApiException.badRequest("Minimum next bid is " + minimumNext);
        }
        bids.findByEventIdAndStoreIdAndStatus(
                event.getId().getEventId(), event.getId().getStoreId(), "winning")
                .ifPresent(prev -> prev.setStatus("outbid"));
        // Global bid_id sequence; manual inserts must use ids >= 90000.
        int nextBidId = bids.findAll().stream()
                .mapToInt(b -> b.getId().getBidId()).max().orElse(0) + 1;
        int round = bids.countByEventIdAndStoreId(event.getId().getEventId(), event.getId().getStoreId()) + 1;
        Bid bid = new Bid();
        bid.setId(new Bid.Id(req.userId(), nextBidId));
        bid.setEventId(event.getId().getEventId());
        bid.setStoreId(event.getId().getStoreId());
        bid.setBidAmount(req.bidAmount());
        bid.setRoundNumber(round);
        bid.setBidDate(LocalDateTime.now());
        bid.setStatus("winning");
        bid.setBidderName(req.bidderName());
        bids.save(bid);
        return toResponse(bid);
    }

    @Transactional
    public BidDtos.BidEventResponse finalizeEvent(Integer eventId, BidDtos.FinalizeRequest req) {
        BidEvent ref = requireByEventId(eventId);
        BidEvent event = events.findForUpdate(ref.getId().getStoreId(), ref.getId().getEventId())
                .orElseThrow(() -> ApiException.notFound("Bid event"));
        if ("finalized".equalsIgnoreCase(event.getStatus())) {
            throw ApiException.conflict("Event is already finalized");
        }
        // The note string is validated but not stored (BOOLEAN column until migration).
        event.setStatus("finalized");
        event.setFinalAllocation(true);
        return toResponse(event);
    }

    BidDtos.BidEventResponse toResponse(BidEvent e) {
        var winning = bids.findByEventIdAndStoreIdAndStatus(
                e.getId().getEventId(), e.getId().getStoreId(), "winning").map(BidService::toResponse).orElse(null);
        return new BidDtos.BidEventResponse(e.getId().getStoreId(), e.getId().getEventId(),
                e.getStartDate(), e.getEndDate(), e.getStatus(), e.getMinimumBidAmount(),
                e.getMinimumBidIncrement(), e.getFinalAllocation(), winning);
    }

    static BidDtos.BidResponse toResponse(Bid b) {
        return new BidDtos.BidResponse(b.getId().getUserId(), b.getId().getBidId(),
                b.getEventId(), b.getStoreId(), b.getBidAmount(), b.getRoundNumber(),
                b.getBidDate(), b.getStatus(), b.getBidderName());
    }
}
