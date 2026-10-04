package com.mallhub.service;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.Attendance;
import com.mallhub.entity.Employee;
import com.mallhub.entity.LeaveRequest;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class EmployeeService {
    private final EmployeeRepository employees;
    private final StoreRepository stores;
    private final LeaveRequestRepository leaves;
    private final PayrollRecordRepository payroll;
    private final AttendanceRepository attendance;

    public EmployeeService(EmployeeRepository employees, StoreRepository stores,
                           LeaveRequestRepository leaves, PayrollRecordRepository payroll,
                           AttendanceRepository attendance) {
        this.employees = employees;
        this.stores = stores;
        this.leaves = leaves;
        this.payroll = payroll;
        this.attendance = attendance;
    }

    public static PeopleDtos.EmployeeResponse toResponse(Employee e) {
        return new PeopleDtos.EmployeeResponse(e.getEmployeeId(), e.getFirstName(),
                e.getLastName(), e.getEmail(), e.getDateOfJoining(), e.getBaseSalary(),
                e.getCurrentDesignation(), e.getPhoneNumber(), e.getStoreId(), e.getMallId());
    }

    public PeopleDtos.EmployeeResponse get(Integer id) {
        return toResponse(require(id));
    }

    @Transactional
    public PeopleDtos.EmployeeResponse create(PeopleDtos.EmployeeCreateRequest req) {
        var store = stores.findById(req.storeId()).orElseThrow(() -> ApiException.notFound("Store"));
        var e = new Employee();
        e.setFirstName(req.firstName());
        e.setLastName(req.lastName());
        e.setEmail(req.email());
        e.setPhoneNumber(req.phoneNumber());
        e.setCurrentDesignation(req.currentDesignation());
        e.setBaseSalary(req.baseSalary());
        e.setStoreId(store.getStoreId());
        e.setMallId(store.getMallId());
        e.setDateOfJoining(LocalDate.now());
        return toResponse(employees.save(e));
    }

    @Transactional
    public void delete(Integer id) {
        if (!employees.existsById(id)) throw ApiException.notFound("Employee");
        employees.deleteById(id);
    }

    public Page<PeopleDtos.LeaveResponse> leaves(Integer empId, Pageable pageable) {
        require(empId);
        return leaves.findByIdEmployeeId(empId, pageable).map(EmployeeService::toLeave);
    }

    @Transactional
    public PeopleDtos.LeaveResponse applyLeave(Integer empId, PeopleDtos.LeaveApplyRequest req) {
        require(empId);
        if (req.endDate().isBefore(req.startDate())) {
            throw ApiException.badRequest("end_date must be on or after start_date");
        }
        int next = leaves.findByIdEmployeeId(empId).stream()
                .mapToInt(l -> l.getId().getRequestId()).max().orElse(0) + 1;
        var l = new LeaveRequest();
        l.setId(new LeaveRequest.Id(empId, next));
        l.setStartDate(req.startDate());
        l.setEndDate(req.endDate());
        l.setStatus("pending");
        l.setReason(req.reason());
        leaves.save(l);
        return toLeave(l);
    }

    @Transactional
    public PeopleDtos.LeaveResponse decideLeave(Integer empId, Integer requestId, String status) {
        var l = leaves.findById(new LeaveRequest.Id(empId, requestId))
                .orElseThrow(() -> ApiException.notFound("Leave request"));
        if (!"pending".equalsIgnoreCase(l.getStatus())) {
            throw ApiException.conflict("Only pending requests can be decided");
        }
        if (!"approved".equalsIgnoreCase(status) && !"rejected".equalsIgnoreCase(status)) {
            throw ApiException.badRequest("status must be approved or rejected");
        }
        l.setStatus(status.toLowerCase());
        return toLeave(l);
    }

    public Page<PeopleDtos.PayrollResponse> payroll(Integer empId, Pageable pageable) {
        require(empId);
        return payroll.findByIdEmployeeId(empId, pageable)
                .map(p -> new PeopleDtos.PayrollResponse(p.getId().getEmployeeId(),
                        p.getId().getRecordId(), p.getAmount(), p.getRecordType(), p.getIssueDate()));
    }

    public Page<PeopleDtos.AttendanceResponse> attendance(Integer empId, LocalDate from, LocalDate to,
                                                        Pageable pageable) {
        require(empId);
        return (from != null && to != null
                ? attendance.findByIdEmployeeIdAndIdDateBetween(empId, from, to, pageable)
                : attendance.findByIdEmployeeIdOrderByIdDateDesc(empId, pageable))
                .map(EmployeeService::toAttendance);
    }

    @Transactional
    public PeopleDtos.AttendanceResponse checkIn(Integer empId) {
        require(empId);
        LocalDate today = LocalDate.now();
        var id = new Attendance.Id(empId, today);
        var existing = attendance.findById(id).orElse(null);
        // Strict: a second check-in is a conflict, not a silent overwrite.
        if (existing != null && existing.getCheckInTime() != null) {
            throw ApiException.conflict("Already checked in today");
        }
        Attendance row = existing != null ? existing : new Attendance();
        if (existing == null) row.setId(id);
        row.setCheckInTime(LocalTime.now().withSecond(0).withNano(0));
        attendance.save(row);
        return toAttendance(row);
    }

    @Transactional
    public PeopleDtos.AttendanceResponse checkOut(Integer empId) {
        require(empId);
        var row = attendance.findById(new Attendance.Id(empId, LocalDate.now())).orElse(null);
        if (row == null || row.getCheckInTime() == null) {
            throw ApiException.notFound("Check-in record for today");
        }
        if (row.getCheckOutTime() != null) {
            throw ApiException.conflict("Already checked out today");
        }
        row.setCheckOutTime(LocalTime.now().withSecond(0).withNano(0));
        return toAttendance(row);
    }

    private Employee require(Integer empId) {
        return employees.findById(empId).orElseThrow(() -> ApiException.notFound("Employee"));
    }

    static PeopleDtos.LeaveResponse toLeave(LeaveRequest l) {
        return new PeopleDtos.LeaveResponse(l.getId().getEmployeeId(), l.getId().getRequestId(),
                l.getStartDate(), l.getEndDate(), l.getStatus(), l.getReason());
    }

    static PeopleDtos.AttendanceResponse toAttendance(Attendance a) {
        return new PeopleDtos.AttendanceResponse(a.getId().getEmployeeId(), a.getId().getDate(),
                a.getCheckInTime(), a.getCheckOutTime());
    }
}