package com.mallhub.controller;

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
                       @RequestParam(required = false) String city) {
        return malls.list(q, city);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return malls.get(id);
    }

    @GetMapping("/{id}/stores")
    public Object stores(@PathVariable Integer id) {
        return malls.storesByMall(id);
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
                            @RequestParam(required = false) Integer storeId) {
        return malls.employeesByMall(id, storeId);
    }

    @GetMapping("/{id}/bid-events")
    public Object bidEvents(@PathVariable Integer id,
                            @RequestParam(required = false) String status) {
        return bids.list(id, status);
    }

    @GetMapping("/{id}/offers")
    public Object offers(@PathVariable Integer id) {
        return malls.offersByMall(id);
    }
}