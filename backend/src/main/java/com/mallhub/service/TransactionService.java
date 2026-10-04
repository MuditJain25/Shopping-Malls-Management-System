package com.mallhub.service;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.Mall;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.MallRepository;
import com.mallhub.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {
    private final TransactionRepository transactions;
    private final MallRepository malls;

    public TransactionService(TransactionRepository transactions, MallRepository malls) {
        this.transactions = transactions;
        this.malls = malls;
    }

    public List<PeopleDtos.TransactionResponse> list(Integer mallId) {
        if (mallId == null) {
            return transactions.findAll().stream().map(TenantService::toResponse).toList();
        }
        Mall mall = malls.findById(mallId).orElseThrow(() -> ApiException.notFound("Mall"));
        // Receiver names are denormalized strings; the mapping lives in one place.
        // TODO: normalize to receiver_mall_id FK if analytics is revived (pending P5).
        return transactions.findByReceiverOrderByTransactionIdAsc(receiverFor(mall)).stream()
                .map(TenantService::toResponse).toList();
    }

    static String receiverFor(Mall mall) {
        if (mall.getCity() == null) return "";
        return switch (mall.getCity()) {
            case "New York" -> "Heritage Plaza Mall";
            case "San Jose" -> "Tech Park Mall";
            case "Chicago" -> "Lakeshore Mall";
            default -> mall.getCity() + " Mall";
        };
    }
}