package com.mallhub.repository;

import com.mallhub.entity.FinancialTransaction;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<FinancialTransaction, Integer> {
    List<FinancialTransaction> findBySenderOrderByTransactionIdAsc(String sender);

    List<FinancialTransaction> findByReceiverOrderByTransactionIdAsc(String receiver);
}