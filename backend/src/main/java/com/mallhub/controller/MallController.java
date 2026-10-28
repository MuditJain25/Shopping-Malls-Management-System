package com.mallhub.controller;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.Paging;
import com.mallhub.service.BidService;
import com.mallhub.service.MallService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@Valid @RequestBody MallDtos.MallCreateRequest req) {
        return malls.create(req);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return malls.get(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        malls.delete(id);
    }

    @GetMapping("/{id}/stores")
    public Object stores(@PathVariable Integer id,
                         @RequestParam(required = false) Integer page,
                         @RequestParam(required = false) Integer size) {
        return Paging.shape(malls.storesByMall(id, Paging.pageable(page, size, "storeId")), page);
    }

    @GetMapping("/nearest")
    public Object nearest(@RequestParam Double lat, @RequestParam Double lng,
                          @RequestParam(defaultValue = "5") Integer limit) {
        return malls.nearest(lat, lng, limit);
    }

    @GetMapping("/{id}/products/top")
    public Object topProducts(@PathVariable Integer id,
                              @RequestParam(required = false) Integer storeId) {
        return malls.topProducts(id, storeId);
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