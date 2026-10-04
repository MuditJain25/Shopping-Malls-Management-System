package com.mallhub.repository;

import com.mallhub.entity.FinancialTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<FinancialTransaction, Integer> {
    Page<FinancialTransaction> findBySender(String sender, Pageable pageable);

    Page<FinancialTransaction> findByReceiver(String receiver, Pageable pageable);
}