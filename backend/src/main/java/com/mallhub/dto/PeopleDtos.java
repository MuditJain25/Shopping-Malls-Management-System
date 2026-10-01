package com.mallhub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class PeopleDtos {
    private PeopleDtos() {
    }

    public record TenantResponse(Integer tenantId, String businessName, String businessType,
                                 String email, LocalDate dateRegistered, String phoneNumber,
                                 List<Integer> storeIds) {
    }

    public record TenantCreateRequest(@NotBlank String businessName, String businessType,
                                      @Email String email, String phoneNumber,
                                      List<Integer> storeIds) {
    }

    public record EmployeeResponse(Integer employeeId, String firstName, String lastName,
                                   String email, LocalDate dateOfJoining, BigDecimal baseSalary,
                                   String currentDesignation, String phoneNumber,
                                   Integer storeId, Integer mallId) {
    }

    public record EmployeeCreateRequest(@NotBlank String firstName, @NotBlank String lastName,
                                        @Email String email, String phoneNumber,
                                        String currentDesignation, BigDecimal baseSalary,
                                        @NotNull Integer storeId) {
    }

    public record ManagerResponse(Integer managerId, String firstName, String lastName,
                                  String email, LocalDate dateJoined, String phoneNumber,
                                  Integer mallId) {
    }

    public record ManagerCreateRequest(@NotBlank String firstName, @NotBlank String lastName,
                                       @Email String email, String phoneNumber,
                                       @NotNull Integer mallId) {
    }

    public record ExecutiveResponse(Integer executiveId, String firstName, String lastName,
                                    String email, LocalDate dateJoined, String phoneNumber,
                                    List<Integer> overseesMallIds) {
    }

    public record LeaveResponse(Integer employeeId, Integer requestId, LocalDate startDate,
                                LocalDate endDate, String status, String reason) {
    }

    public record LeaveApplyRequest(@NotNull LocalDate startDate, @NotNull LocalDate endDate,
                                    String reason) {
    }

    public record LeaveDecisionRequest(@NotBlank String status) {
    }

    public record PayrollResponse(Integer employeeId, Integer recordId, BigDecimal amount,
                                  String recordType, LocalDate issueDate) {
    }

    public record AttendanceResponse(Integer employeeId, LocalDate date,
                                     LocalTime checkInTime, LocalTime checkOutTime) {
    }

    public record TransactionResponse(Integer transactionId, BigDecimal amount, String sender,
                                      String receiver, String senderType, String receiverType,
                                      LocalDate transactionDate, String remarks) {
    }
}
