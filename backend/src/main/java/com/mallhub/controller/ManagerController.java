package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.service.ManagerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/managers")
public class ManagerController {
    private final ManagerService managers;

    public ManagerController(ManagerService managers) {
        this.managers = managers;
    }

    @GetMapping
    @PreAuthorize("hasRole('EXECUTIVE')")
    public Object list(@RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(managers.list(Paging.pageable(page, size, "managerId")), page);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE') and @access.canAccessManager(#id)")
    public Object get(@PathVariable Integer id) {
        return managers.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EXECUTIVE')")
    public Object update(@PathVariable Integer id,
                         @Valid @RequestBody PeopleDtos.ManagerCreateRequest req) {
        return managers.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EXECUTIVE')")
    public void delete(@PathVariable Integer id) {
        managers.delete(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('EXECUTIVE')")
    public Object create(@Valid @RequestBody PeopleDtos.ManagerCreateRequest req) {
        return managers.create(req);
    }
}