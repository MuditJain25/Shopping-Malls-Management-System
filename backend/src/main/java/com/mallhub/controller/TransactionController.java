package com.mallhub.controller;

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
    public Object list(@RequestParam(required = false) Integer mallId) {
        return transactions.list(mallId);
    }
}
