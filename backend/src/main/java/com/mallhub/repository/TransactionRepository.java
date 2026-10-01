package com.mallhub.repository;

import com.mallhub.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<FinancialTransaction, Integer> {
    List<FinancialTransaction> findBySender(String sender);
    List<FinancialTransaction> findByReceiver(String receiver);
}
