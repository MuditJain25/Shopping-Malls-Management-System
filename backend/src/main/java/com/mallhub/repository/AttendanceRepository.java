package com.mallhub.repository;

import com.mallhub.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Attendance.Id> {
    List<Attendance> findByIdEmployeeIdOrderByIdDateDesc(Integer employeeId);
    List<Attendance> findByIdEmployeeIdAndIdDateBetween(Integer employeeId, LocalDate from, LocalDate to);
}
