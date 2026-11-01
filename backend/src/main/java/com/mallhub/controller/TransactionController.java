package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactions;

    public TransactionController(TransactionService transactions) {
        this.transactions = transactions;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER','EXECUTIVE')")
    public Object list(@RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(transactions.list(Paging.pageable(page, size, TransactionService.NEWEST_FIRST)), page);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER','EXECUTIVE')")
    public Object create(@Valid @RequestBody PeopleDtos.TransactionRequest req) {
        return transactions.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public Object update(@PathVariable Integer id,
                         @Valid @RequestBody PeopleDtos.TransactionRequest req) {
        return transactions.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public void delete(@PathVariable Integer id) {
        transactions.delete(id);
    }
}
