package com.mallhub.repository;

import com.mallhub.entity.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, PayrollRecord.Id> {
    List<PayrollRecord> findByIdEmployeeId(Integer employeeId);
}
