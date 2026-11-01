package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.security.Access;
import com.mallhub.service.TenantService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/revenue")
public class RevenueController {
    private final TenantService tenants;
    private final Access access;

    public RevenueController(TenantService tenants, Access access) {
        this.tenants = tenants;
        this.access = access;
    }

    /** All revenue reports. Executive: everything (or ?mallId=); manager: tenants renting in own mall. */
    @GetMapping
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(tenants.allRevenue(access.scopeMall(mallId),
                Paging.pageable(page, size, "id.tenantId")), page);
    }
}
