package com.mallhub.repository;

import com.mallhub.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, LeaveRequest.Id> {
    Page<LeaveRequest> findByIdEmployeeId(Integer employeeId, Pageable pageable);

    List<LeaveRequest> findByIdEmployeeId(Integer employeeId);
}