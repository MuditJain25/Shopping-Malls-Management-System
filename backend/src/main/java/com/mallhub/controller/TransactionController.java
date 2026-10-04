package com.mallhub.controller;

import com.mallhub.dto.Paging;
import com.mallhub.service.TransactionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactions;

    public TransactionController(TransactionService transactions) {
        this.transactions = transactions;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) Integer mallId,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        return Paging.shape(transactions.list(mallId, Paging.pageable(page, size, "transactionId")), page);
    }
}