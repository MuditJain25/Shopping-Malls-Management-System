package com.mallhub.repository;

import com.mallhub.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, LeaveRequest.Id> {
    List<LeaveRequest> findByIdEmployeeId(Integer employeeId);

    List<LeaveRequest> findByIdEmployeeIdOrderByIdRequestIdAsc(Integer employeeId);
}