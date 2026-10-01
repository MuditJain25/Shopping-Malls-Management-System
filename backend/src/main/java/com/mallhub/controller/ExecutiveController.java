package com.mallhub.controller;

import com.mallhub.service.ExecutiveService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/executives")
public class ExecutiveController {
    private final ExecutiveService executives;

    public ExecutiveController(ExecutiveService executives) {
        this.executives = executives;
    }

    @GetMapping("/{id}")
    public Object get(@PathVariable Integer id) {
        return executives.get(id);
    }

    @GetMapping("/{id}/malls")
    public Object malls(@PathVariable Integer id) {
        return executives.mallsByExecutive(id);
    }
}
