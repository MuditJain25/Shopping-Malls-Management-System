package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.exception.ApiException;
import com.mallhub.service.EmployeeService;
import com.mallhub.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {
    private final TenantService tenants;
    private final EmployeeService employees;

    public TenantController(TenantService tenants, EmployeeService employees) {
        this.tenants = tenants;
        this.employees = employees;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size,
                       @RequestParam(required = false, name = "sort") List<String> sort) {
        return Paging.wrap(tenants.list(mallId), page, size, sort);
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return tenants.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@Valid @RequestBody PeopleDtos.TenantCreateRequest req) {
        return tenants.create(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        tenants.delete(id);
    }

    @GetMapping("/{id}/stores")
    public Object stores(@PathVariable Integer id) {
        return tenants.storesByTenant(id);
    }

    @GetMapping("/{id}/employees")
    public Object employees(@PathVariable Integer id) {
        return tenants.employeesByTenant(id);
    }

    @PostMapping("/{id}/employees")
    @ResponseStatus(HttpStatus.CREATED)
    public Object addEmployee(@PathVariable Integer id,
                              @Valid @RequestBody PeopleDtos.EmployeeCreateRequest req) {
        boolean owns = tenants.storesByTenant(id).stream().anyMatch(s -> s.storeId().equals(req.storeId()));
        if (!owns) throw ApiException.badRequest("Store does not belong to this tenant");
        return employees.create(req);
    }

    @GetMapping("/{id}/transactions")
    public Object transactions(@PathVariable Integer id) {
        return tenants.transactionsByTenant(id);
    }
}
