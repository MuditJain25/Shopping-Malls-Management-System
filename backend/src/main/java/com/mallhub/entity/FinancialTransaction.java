package com.mallhub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Financial_Transaction")
@Getter
@Setter
@NoArgsConstructor
public class FinancialTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Integer transactionId;

    private BigDecimal amount;
    private String sender;
    private String receiver;

    @Column(name = "sender_type")
    private String senderType;

    @Column(name = "receiver_type")
    private String receiverType;

    @Column(name = "transaction_date")
    private LocalDate transactionDate;

    @Column(columnDefinition = "TEXT")
    private String remarks;
}
