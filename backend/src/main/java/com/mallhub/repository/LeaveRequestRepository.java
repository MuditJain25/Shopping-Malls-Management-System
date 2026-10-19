package com.mallhub.repository;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, LeaveRequest.Id> {
    Page<LeaveRequest> findByIdEmployeeId(Integer employeeId, Pageable pageable);

    List<LeaveRequest> findByIdEmployeeId(Integer employeeId);

    @Query("""
            SELECT new com.mallhub.dto.PeopleDtos$StoreLeaveResponse(
                l.id.employeeId, e.firstName, e.lastName, e.currentDesignation,
                l.id.requestId, l.startDate, l.endDate, l.status, l.reason)
            FROM LeaveRequest l
            JOIN Employee e ON e.employeeId = l.id.employeeId
            WHERE e.storeId = :storeId
              AND (:status IS NULL OR LOWER(l.status) = LOWER(:status))
            """)
    Page<PeopleDtos.StoreLeaveResponse> findForStore(@Param("storeId") Integer storeId,
                                                     @Param("status") String status,
                                                     Pageable pageable);
}