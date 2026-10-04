package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.service.BidService;
import com.mallhub.service.MallService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/malls")
public class MallController {
    private final MallService malls;
    private final BidService bids;

    public MallController(MallService malls, BidService bids) {
        this.malls = malls;
        this.bids = bids;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) String q,
                       @RequestParam(required = false) String city,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(malls.list(q, city, Paging.pageable(page, size, "mallId")), page);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return malls.get(id);
    }

    @GetMapping("/{id}/stores")
    public Object stores(@PathVariable Integer id,
                         @RequestParam(required = false) Integer page,
                         @RequestParam(required = false) Integer size) {
        return Paging.shape(malls.storesByMall(id, Paging.pageable(page, size, "storeId")), page);
    }

    @GetMapping("/{id}/products/top")
    public Object topProducts(@PathVariable Integer id) {
        return malls.topProducts(id);
    }

    @GetMapping("/{id}/manager")
    public Object manager(@PathVariable Integer id) {
        return malls.managerByMall(id);
    }

    @GetMapping("/{id}/employees")
    public Object employees(@PathVariable Integer id,
                            @RequestParam(required = false) Integer storeId,
                            @RequestParam(required = false) Integer page,
                            @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "employeeId");
        return Paging.shape(malls.employeesByMall(id, storeId, p), page);
    }

    @GetMapping("/{id}/bid-events")
    public Object bidEvents(@PathVariable Integer id,
                            @RequestParam(required = false) String status,
                            @RequestParam(required = false) Integer page,
                            @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.eventId");
        return Paging.shape(bids.list(id, status, p), page);
    }

    @GetMapping("/{id}/offers")
    public Object offers(@PathVariable Integer id,
                         @RequestParam(required = false) Integer page,
                         @RequestParam(required = false) Integer size) {
        return Paging.shape(malls.offersByMall(id, Paging.pageable(page, size, "id.offerId")), page);
    }
}