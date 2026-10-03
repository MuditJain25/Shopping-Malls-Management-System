package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.service.BidService;
import com.mallhub.service.EmployeeService;
import com.mallhub.service.MallService;
import com.mallhub.service.StoreService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/malls")
public class MallController {
    private final MallService malls;
    private final StoreService stores;
    private final EmployeeService employees;
    private final BidService bids;

    public MallController(MallService malls, StoreService stores,
                          EmployeeService employees, BidService bids) {
        this.malls = malls;
        this.stores = stores;
        this.employees = employees;
        this.bids = bids;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) String q,
                       @RequestParam(required = false) String city,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size,
                       @RequestParam(required = false, name = "sort") List<String> sort) {
        return Paging.wrap(malls.list(q, city), page, size, sort);
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
        var all = employees.byMall(id);
        if (storeId != null) all = all.stream().filter(e -> storeId.equals(e.storeId())).toList();
        return all;
    }

    @GetMapping("/{id}/bid-events")
    public Object bidEvents(@PathVariable Integer id,
                            @RequestParam(required = false) String status) {
        return bids.list(id, status);
    }

    @GetMapping("/{id}/offers")
    public Object offers(@PathVariable Integer id) {
        return malls.storesByMall(id).stream()
                .flatMap(s -> stores.offersByStore(s.storeId()).stream()).toList();
    }
}
