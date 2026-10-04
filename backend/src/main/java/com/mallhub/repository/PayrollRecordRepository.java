package com.mallhub.repository;

import com.mallhub.entity.PayrollRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, PayrollRecord.Id> {
    Page<PayrollRecord> findByIdEmployeeId(Integer employeeId, Pageable pageable);
}