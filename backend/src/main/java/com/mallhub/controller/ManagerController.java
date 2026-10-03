package com.mallhub.controller;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.service.ManagerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/managers")
public class ManagerController {
    private final ManagerService managers;

    public ManagerController(ManagerService managers) {
        this.managers = managers;
    }

    @GetMapping
    public Object list() {
        return managers.list();
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return managers.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@Valid @RequestBody PeopleDtos.ManagerCreateRequest req) {
        return managers.create(req);
    }
}
