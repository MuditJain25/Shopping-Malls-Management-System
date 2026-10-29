package com.mallhub.service;

import com.mallhub.dto.BidDtos;
import com.mallhub.entity.Bid;
import com.mallhub.entity.BidEvent;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.BidEventRepository;
import com.mallhub.repository.BidRepository;
import com.mallhub.repository.StoreRepository;
import com.mallhub.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BidService {
    private final BidEventRepository events;
    private final BidRepository bids;
    private final StoreRepository stores;
    private final UserRepository users;

    public BidService(BidEventRepository events, BidRepository bids,
                      StoreRepository stores, UserRepository users) {
        this.events = events;
        this.bids = bids;
        this.stores = stores;
        this.users = users;
    }

    public Page<BidDtos.BidEventResponse> list(Integer mallId, String status, Pageable pageable) {
        Page<BidEvent> page = mallId == null
                ? events.findByStatus(status, pageable)
                : events.findByMallAndStatus(mallId, status, pageable);
        return new PageImpl<>(toResponses(page.getContent()), page.getPageable(),
                page.getTotalElements());
    }

    public BidDtos.BidEventResponse get(Integer eventId) {
        return toResponse(requireByEventId(eventId));
    }

    @Transactional
    public BidDtos.BidEventResponse createEvent(BidDtos.BidEventCreateRequest req) {
        if (req.endDate().isBefore(req.startDate())) {
            throw ApiException.badRequest("end_date must be on or after start_date");
        }
        var store = stores.findById(req.storeId()).orElseThrow(() -> ApiException.notFound("Store"));
        if (!"available".equalsIgnoreCase(store.getStatus())) {
            throw ApiException.conflict("Store is not available for bidding");
        }
        if (events.existsByIdStoreIdAndStatus(req.storeId(), "open")) {
            throw ApiException.conflict("Store already has an open bid event");
        }
        // ponytail: MAX+1 has a race under concurrent creates; upgrade to a DB
        // sequence/unique index if event creation becomes concurrent.
        int next = events.findMaxEventId() + 1;
        var e = new BidEvent();
        e.setId(new BidEvent.Id(req.storeId(), next));
        e.setStartDate(req.startDate());
        e.setEndDate(req.endDate());
        e.setMinimumBidAmount(req.minimumBidAmount());
        e.setMinimumBidIncrement(req.minimumBidIncrement());
        e.setFinalAllocation(false);
        e.setStatus("open");
        events.save(e);
        return toResponse(e);
    }

    public Page<BidDtos.BidResponse> bidsByUser(Integer userId, Pageable pageable) {
        if (!users.existsById(userId)) throw ApiException.notFound("User");
        return bids.findByIdUserId(userId, pageable).map(BidService::toResponse);
    }

    public Page<BidDtos.BidResponse> bidsByEvent(Integer eventId, Pageable pageable) {
        BidEvent e = requireByEventId(eventId);
        return bids.findByEventIdAndStoreIdOrderByRoundNumberAsc(
                e.getId().getEventId(), e.getId().getStoreId(), pageable).map(BidService::toResponse);
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
        BidEvent.Id key = event.getId();
        BigDecimal highest = bids.findByEventIdAndStoreIdAndStatus(
                        key.getEventId(), key.getStoreId(), "winning")
                .map(Bid::getBidAmount).orElse(event.getMinimumBidAmount());
        BigDecimal minimumNext = highest.add(event.getMinimumBidIncrement());
        if (req.bidAmount().compareTo(minimumNext) < 0) {
            throw ApiException.badRequest("Minimum next bid is " + minimumNext);
        }
        bids.findByEventIdAndStoreIdAndStatus(key.getEventId(), key.getStoreId(), "winning")
                .ifPresent(prev -> prev.setStatus("outbid"));
        // Global bid_id sequence; manual inserts must use ids >= 90000.
        int nextBidId = bids.findAll().stream()
                .mapToInt(b -> b.getId().getBidId()).max().orElse(0) + 1;
        int round = bids.countByEventIdAndStoreId(key.getEventId(), key.getStoreId()) + 1;
        Bid bid = new Bid();
        bid.setId(new Bid.Id(req.userId(), nextBidId));
        bid.setEventId(key.getEventId());
        bid.setStoreId(key.getStoreId());
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

    @Transactional
    public void deleteEvent(Integer eventId) {
        BidEvent e = requireByEventId(eventId);
        if (bids.countByEventIdAndStoreId(e.getId().getEventId(), e.getId().getStoreId()) > 0) {
            throw ApiException.conflict("Bid event already has bids");
        }
        events.delete(e);
    }

    BidDtos.BidEventResponse toResponse(BidEvent e) {
        BidEvent.Id key = e.getId();
        var winning = bids.findByEventIdAndStoreIdAndStatus(
                key.getEventId(), key.getStoreId(), "winning").map(BidService::toResponse).orElse(null);
        return toResponse(e, winning);
    }

    /** One winning-bid query for the whole page instead of one per event. */
    List<BidDtos.BidEventResponse> toResponses(List<BidEvent> batch) {
        if (batch.isEmpty()) return List.of();
        Map<Integer, BidDtos.BidResponse> winners = bids.findByStatusAndEventIdIn("winning",
                        batch.stream().map(e -> e.getId().getEventId()).toList()).stream()
                .collect(Collectors.toMap(b -> b.getEventId(), BidService::toResponse));
        return batch.stream()
                .map(e -> toResponse(e, winners.get(e.getId().getEventId())))
                .toList();
    }

    private BidDtos.BidEventResponse toResponse(BidEvent e, BidDtos.BidResponse winning) {
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