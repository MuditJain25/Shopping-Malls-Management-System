package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.exception.ApiException;
import com.mallhub.security.Access;
import com.mallhub.service.EmployeeService;
import com.mallhub.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {
    private final TenantService tenants;
    private final EmployeeService employees;
    private final Access access;

    public TenantController(TenantService tenants, EmployeeService employees, Access access) {
        this.tenants = tenants;
        this.employees = employees;
        this.access = access;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(tenants.list(access.scopeMall(mallId), Paging.pageable(page, size, "tenantId")), page);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return tenants.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public Object create(@Valid @RequestBody PeopleDtos.TenantCreateRequest req) {
        return tenants.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessTenant(#id)")
    public Object update(@PathVariable Integer id,
                         @Valid @RequestBody PeopleDtos.TenantUpdateRequest req) {
        return tenants.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE') and @access.canAccessTenant(#id)")
    public void delete(@PathVariable Integer id) {
        tenants.delete(id);
    }

    @GetMapping("/{id}/stores")
    public Object stores(@PathVariable Integer id) {
        return tenants.storesByTenant(id);
    }

    @PostMapping("/{id}/stores/{storeId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE') and @access.canAccessStore(#storeId)")
    public Object linkStore(@PathVariable Integer id, @PathVariable Integer storeId) {
        return tenants.linkStore(id, storeId);
    }

    @DeleteMapping("/{id}/stores/{storeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE') and @access.canAccessStore(#storeId)")
    public void unlinkStore(@PathVariable Integer id, @PathVariable Integer storeId) {
        tenants.unlinkStore(id, storeId);
    }

    @GetMapping("/{id}/employees")
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessTenant(#id)")
    public Object employeesByTenant(@PathVariable Integer id,
                                    @RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "employeeId");
        return Paging.shape(tenants.employeesByTenant(id, p), page);
    }

    @PostMapping("/{id}/employees")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('TENANT') and @access.canAccessTenant(#id)")
    public Object addEmployee(@PathVariable Integer id,
                              @Valid @RequestBody PeopleDtos.EmployeeCreateRequest req) {
        if (!tenants.ownsStore(id, req.storeId())) {
            throw ApiException.badRequest("Store does not belong to this tenant");
        }
        return employees.create(req);
    }

    @GetMapping("/{id}/transactions")
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessTenant(#id)")
    public Object transactions(@PathVariable Integer id,
                               @RequestParam(required = false) Integer page,
                               @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "transactionId");
        return Paging.shape(tenants.transactionsByTenant(id, p), page);
    }

    @GetMapping("/{id}/revenue")
    @PreAuthorize("hasAnyRole('TENANT','EXECUTIVE') and @access.canAccessTenant(#id)")
    public Object revenue(@PathVariable Integer id,
                          @RequestParam(required = false) Integer page,
                          @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.informationId");
        return Paging.shape(tenants.revenueByTenant(id, p), page);
    }

    @PostMapping("/{id}/revenue")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('TENANT') and @access.canAccessTenant(#id)")
    public Object submitRevenue(@PathVariable Integer id,
                                @Valid @RequestBody PeopleDtos.RevenueCreateRequest req) {
        return tenants.submitRevenue(id, req);
    }
}