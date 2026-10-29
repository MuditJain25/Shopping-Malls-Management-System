package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.service.EmployeeService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestController {
    private final EmployeeService employees;

    public LeaveRequestController(EmployeeService employees) {
        this.employees = employees;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SHOP_MANAGER','TENANT','MALL_MANAGER','EXECUTIVE') and @access.canAccessStore(#storeId)")
    public Object list(@RequestParam Integer storeId,
                       @RequestParam(required = false) String status,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        var p = Paging.pageable(page, size, "id.requestId");
        return Paging.shape(employees.storeLeaves(storeId, status, p), page);
    }
}
