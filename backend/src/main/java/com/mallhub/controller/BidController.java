package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.service.BidService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bids")
public class BidController {
    private final BidService bids;

    public BidController(BidService bids) {
        this.bids = bids;
    }

    @GetMapping
    @PreAuthorize("@access.isSelf(#userId)")
    public Object list(@RequestParam Integer userId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.bidId");
        return Paging.shape(bids.bidsByUser(userId, p), page);
    }
}
