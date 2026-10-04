package com.mallhub.controller;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.Paging;
import com.mallhub.service.StoreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stores")
public class StoreController {
    private final StoreService stores;

    public StoreController(StoreService stores) {
        this.stores = stores;
    }

    @GetMapping("/available")
    public Object available(@RequestParam(required = false) Integer mallId,
                            @RequestParam(required = false) Integer page,
                            @RequestParam(required = false) Integer size) {
        return Paging.shape(stores.available(mallId, Paging.pageable(page, size, "storeId")), page);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return stores.get(id);
    }

    @GetMapping("/{id}/products")
    public Object products(@PathVariable Integer id,
                           @RequestParam(required = false) Integer page,
                           @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.productId");
        return Paging.shape(stores.productsByStore(id, p), page);
    }

    @PostMapping("/{id}/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Object addProduct(@PathVariable Integer id,
                             @Valid @RequestBody MallDtos.ProductCreateRequest req) {
        return stores.addProduct(id, req);
    }

    @PutMapping("/{id}/products/{pid}")
    public Object setVisibility(@PathVariable Integer id, @PathVariable Integer pid,
                                @RequestBody MallDtos.VisibilityRequest req) {
        stores.setVisibility(id, pid, req == null ? null : req.toShow());
        return Map.of("success", true);
    }

    @GetMapping("/{id}/employees")
    public Object employees(@PathVariable Integer id,
                            @RequestParam(required = false) Integer page,
                            @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "employeeId");
        return Paging.shape(stores.employeesByStore(id, p), page);
    }

    @GetMapping("/{id}/offers")
    public Object offers(@PathVariable Integer id,
                         @RequestParam(required = false) Integer page,
                         @RequestParam(required = false) Integer size) {
        return Paging.shape(stores.offersByStore(id, Paging.pageable(page, size, "id.offerId")), page);
    }

    @PostMapping("/{id}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public Object createOffer(@PathVariable Integer id,
                              @Valid @RequestBody MallDtos.OfferCreateRequest req) {
        return stores.createOffer(id, req);
    }

    @PutMapping("/{id}/offers/{oid}")
    public Object updateOffer(@PathVariable Integer id, @PathVariable Integer oid,
                              @Valid @RequestBody MallDtos.OfferCreateRequest req) {
        return stores.updateOffer(id, oid, req);
    }

    @DeleteMapping("/{id}/offers/{oid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOffer(@PathVariable Integer id, @PathVariable Integer oid) {
        stores.deleteOffer(id, oid);
    }
}