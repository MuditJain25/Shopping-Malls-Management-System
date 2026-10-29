package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.security.Access;
import com.mallhub.service.TransactionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactions;
    private final Access access;

    public TransactionController(TransactionService transactions, Access access) {
        this.transactions = transactions;
        this.access = access;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MALL_MANAGER','EXECUTIVE')")
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(transactions.list(access.scopeMall(mallId),
                Paging.pageable(page, size, "transactionId")), page);
    }
}