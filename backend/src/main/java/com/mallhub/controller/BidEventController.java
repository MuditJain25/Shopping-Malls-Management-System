package com.mallhub.controller;

import com.mallhub.dto.BidDtos;
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
                       @RequestParam(required = false) String status) {
        return bids.list(mallId, status);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return bids.get(id);
    }

    @GetMapping("/{id}/bids")
    public Object bids(@PathVariable Integer id) {
        return bids.bidsByEvent(id);
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