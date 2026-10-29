package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService employees;

    public EmployeeController(EmployeeService employees) {
        this.employees = employees;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','SHOP_MANAGER') and @access.canAccessStore(#req.storeId())")
    public Object create(@Valid @RequestBody PeopleDtos.EmployeeCreateRequest req) {
        return employees.create(req);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER','TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessEmployee(#id)")
    public Object get(@PathVariable Integer id) {
        return employees.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER','EXECUTIVE') and @access.canAccessEmployee(#id) and @access.canAccessStore(#req.storeId())")
    public Object update(@PathVariable Integer id,
                         @Valid @RequestBody PeopleDtos.EmployeeCreateRequest req) {
        return employees.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','SHOP_MANAGER') and @access.canAccessEmployee(#id)")
    public void delete(@PathVariable Integer id) {
        employees.delete(id);
    }

    @GetMapping("/{id}/leave-requests")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER','TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessEmployee(#id)")
    public Object leaves(@PathVariable Integer id,
                         @RequestParam(required = false) Integer page,
                         @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.requestId");
        return Paging.shape(employees.leaves(id, p), page);
    }

    @PostMapping("/{id}/leave-requests")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER') and @access.canAccessEmployee(#id)")
    public Object applyLeave(@PathVariable Integer id,
                             @Valid @RequestBody PeopleDtos.LeaveApplyRequest req) {
        return employees.applyLeave(id, req);
    }

    @PatchMapping("/{id}/leave-requests/{rid}")
    @PreAuthorize("hasAnyRole('TENANT','MALL_MANAGER','SHOP_MANAGER') and @access.canAccessEmployee(#id)")
    public Object decideLeave(@PathVariable Integer id, @PathVariable Integer rid,
                              @Valid @RequestBody PeopleDtos.LeaveDecisionRequest req) {
        return employees.decideLeave(id, rid, req.status());
    }

    @GetMapping("/{id}/payroll")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER','TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessEmployee(#id)")
    public Object payroll(@PathVariable Integer id,
                          @RequestParam(required = false) Integer page,
                          @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.recordId");
        return Paging.shape(employees.payroll(id, p), page);
    }

    @GetMapping("/{id}/attendance")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER','TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessEmployee(#id)")
    public Object attendance(@PathVariable Integer id,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                             @RequestParam(required = false) Integer page,
                             @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.date");
        return Paging.shape(employees.attendance(id, from, to, p), page);
    }

    @PostMapping("/{id}/attendance/check-in")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER') and @access.canAccessEmployee(#id)")
    public Object checkIn(@PathVariable Integer id) {
        return employees.checkIn(id);
    }

    @PostMapping("/{id}/attendance/check-out")
    @PreAuthorize("hasAnyRole('EMPLOYEE','SHOP_MANAGER') and @access.canAccessEmployee(#id)")
    public Object checkOut(@PathVariable Integer id) {
        return employees.checkOut(id);
    }
}