package com.mallhub.service;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.FinancialTransaction;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

// A plain ledger: sender/receiver are raw account values, so rows carry no mall link.
@Service
public class TransactionService {
    private final TransactionRepository transactions;

    public TransactionService(TransactionRepository transactions) {
        this.transactions = transactions;
    }

    public Page<PeopleDtos.TransactionResponse> list(Pageable pageable) {
        return transactions.findAll(pageable).map(TenantService::toResponse);
    }

    @Transactional
    public PeopleDtos.TransactionResponse create(PeopleDtos.TransactionRequest req) {
        var tx = new FinancialTransaction();
        apply(tx, req);
        if (tx.getTransactionDate() == null) tx.setTransactionDate(LocalDate.now());
        return TenantService.toResponse(transactions.save(tx));
    }

    @Transactional
    public PeopleDtos.TransactionResponse update(Integer id, PeopleDtos.TransactionRequest req) {
        var tx = transactions.findById(id).orElseThrow(() -> ApiException.notFound("Transaction"));
        LocalDate keep = tx.getTransactionDate();
        apply(tx, req);
        if (tx.getTransactionDate() == null) tx.setTransactionDate(keep);
        return TenantService.toResponse(tx);
    }

    private static void apply(FinancialTransaction tx, PeopleDtos.TransactionRequest req) {
        tx.setAmount(req.amount());
        tx.setSender(req.sender());
        tx.setReceiver(req.receiver());
        tx.setSenderType(req.senderType());
        tx.setReceiverType(req.receiverType());
        tx.setTransactionDate(req.transactionDate());
        tx.setRemarks(req.remarks());
    }
}
