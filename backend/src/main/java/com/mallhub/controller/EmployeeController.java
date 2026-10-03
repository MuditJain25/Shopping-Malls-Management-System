package com.mallhub.controller;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService employees;

    public EmployeeController(EmployeeService employees) {
        this.employees = employees;
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return employees.get(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        employees.delete(id);
    }

    @GetMapping("/{id}/leave-requests")
    public Object leaves(@PathVariable Integer id) {
        return employees.leaves(id);
    }

    @PostMapping("/{id}/leave-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public Object applyLeave(@PathVariable Integer id,
                             @Valid @RequestBody PeopleDtos.LeaveApplyRequest req) {
        return employees.applyLeave(id, req);
    }

    @PatchMapping("/{id}/leave-requests/{rid}")
    public Object decideLeave(@PathVariable Integer id, @PathVariable Integer rid,
                              @Valid @RequestBody PeopleDtos.LeaveDecisionRequest req) {
        return employees.decideLeave(id, rid, req.status());
    }

    @GetMapping("/{id}/payroll")
    public Object payroll(@PathVariable Integer id) {
        return employees.payroll(id);
    }

    @GetMapping("/{id}/attendance")
    public Object attendance(@PathVariable Integer id,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return employees.attendance(id, from, to);
    }

    @PostMapping("/{id}/attendance/check-in")
    public Object checkIn(@PathVariable Integer id) {
        return employees.checkIn(id);
    }

    @PostMapping("/{id}/attendance/check-out")
    public Object checkOut(@PathVariable Integer id) {
        return employees.checkOut(id);
    }
}
