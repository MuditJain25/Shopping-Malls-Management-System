package com.mallhub.controller;

import com.mallhub.dto.BidDtos;
import com.mallhub.dto.Paging;
import com.mallhub.service.BidService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bid-events")
public class BidEventController {
    private final BidService bids;

    public BidEventController(BidService bids) {
        this.bids = bids;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) String status,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.eventId");
        return Paging.shape(bids.list(mallId, status, p), page);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return bids.get(id);
    }

    @GetMapping("/{id}/bids")
    public Object bids(@PathVariable Integer id,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "roundNumber");
        return Paging.shape(bids.bidsByEvent(id, p), page);
    }

    @PostMapping("/{id}/bids")
    @ResponseStatus(HttpStatus.CREATED)
    public Object place(@PathVariable Integer id, @Valid @RequestBody BidDtos.PlaceBidRequest req) {
        return bids.placeBid(id, req);
    }

    @PutMapping("/{id}/finalize")
    public Object finalizeEvent(@PathVariable Integer id,
                                @RequestBody(required = false) BidDtos.FinalizeRequest req) {
        return bids.finalizeEvent(id, req);
    }
}