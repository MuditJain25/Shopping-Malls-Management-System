package com.mallhub.repository;

import com.mallhub.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface AttendanceRepository extends JpaRepository<Attendance, Attendance.Id> {
    Page<Attendance> findByIdEmployeeIdOrderByIdDateDesc(Integer employeeId, Pageable pageable);

    Page<Attendance> findByIdEmployeeIdAndIdDateBetween(Integer employeeId, LocalDate from,
                                                       LocalDate to, Pageable pageable);
}