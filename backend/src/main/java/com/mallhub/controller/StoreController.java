package com.mallhub.controller;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.Paging;
import com.mallhub.service.StoreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stores")
public class StoreController {
    private final StoreService stores;

    public StoreController(StoreService stores) {
        this.stores = stores;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) String status,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(stores.list(mallId, status, Paging.pageable(page, size, "storeId")), page);
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public Object create(@Valid @RequestBody MallDtos.StoreCreateRequest req) {
        return stores.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE')")
    public Object update(@PathVariable Integer id,
                         @Valid @RequestBody MallDtos.StoreUpdateRequest req) {
        return stores.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public void delete(@PathVariable Integer id) {
        stores.delete(id);
    }

    @GetMapping("/{id}/products")
    public Object products(@PathVariable Integer id,
                           @RequestParam(required = false) Integer page,
                           @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.productId");
        return Paging.shape(stores.productsByStore(id, p), page);
    }

    @PostMapping("/{id}/products/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER')")
    public Object attachProduct(@PathVariable Integer id, @PathVariable Integer productId,
                                @RequestBody(required = false) MallDtos.VisibilityRequest req) {
        return stores.attachProduct(id, productId, req == null ? null : req.toShow());
    }

    @PutMapping("/{id}/products/{pid}")
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER')")
    public Object setVisibility(@PathVariable Integer id, @PathVariable Integer pid,
                                @RequestBody MallDtos.VisibilityRequest req) {
        stores.setVisibility(id, pid, req == null ? null : req.toShow());
        return Map.of("success", true);
    }

    @DeleteMapping("/{id}/products/{pid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER')")
    public void detachProduct(@PathVariable Integer id, @PathVariable Integer pid) {
        stores.detachProduct(id, pid);
    }

    @GetMapping("/{id}/employees")
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER','EXECUTIVE')")
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
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE')")
    public Object createOffer(@PathVariable Integer id,
                              @Valid @RequestBody MallDtos.OfferCreateRequest req) {
        return stores.createOffer(id, req);
    }

    @PutMapping("/{id}/offers/{oid}")
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE')")
    public Object updateOffer(@PathVariable Integer id, @PathVariable Integer oid,
                              @Valid @RequestBody MallDtos.OfferCreateRequest req) {
        return stores.updateOffer(id, oid, req);
    }

    @DeleteMapping("/{id}/offers/{oid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE')")
    public void deleteOffer(@PathVariable Integer id, @PathVariable Integer oid) {
        stores.deleteOffer(id, oid);
    }
}