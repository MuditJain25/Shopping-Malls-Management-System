package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.StoreTenant;
import com.mallhub.entity.Tenant;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class TenantService {
    private final TenantRepository tenants;
    private final StoreTenantRepository joins;
    private final StoreRepository stores;
    private final EmployeeRepository employees;
    private final TransactionRepository transactions;

    public TenantService(TenantRepository tenants, StoreTenantRepository joins,
                         StoreRepository stores, EmployeeRepository employees,
                         TransactionRepository transactions) {
        this.tenants = tenants;
        this.joins = joins;
        this.stores = stores;
        this.employees = employees;
        this.transactions = transactions;
    }

    public List<PeopleDtos.TenantResponse> list(Integer mallId) {
        List<Tenant> all = tenants.findAll();
        if (mallId != null) {
            List<Integer> mallStores = stores.findByMallId(mallId).stream()
                    .map(com.mallhub.entity.Store::getStoreId).toList();
            all = all.stream()
                    .filter(t -> storeIds(t.getTenantId()).stream().anyMatch(mallStores::contains))
                    .toList();
        }
        return all.stream()
                .sorted(Comparator.comparing(Tenant::getTenantId))
                .map(this::toResponse).toList();
    }

    public PeopleDtos.TenantResponse get(Integer id) {
        return toResponse(tenants.findById(id).orElseThrow(() -> ApiException.notFound("Tenant")));
    }

    @Transactional
    public PeopleDtos.TenantResponse create(PeopleDtos.TenantCreateRequest req) {
        var t = new Tenant();
        t.setBusinessName(req.businessName());
        t.setBusinessType(req.businessType());
        t.setEmail(req.email());
        t.setPhoneNumber(req.phoneNumber());
        t.setDateRegistered(LocalDate.now());
        t = tenants.save(t);
        if (req.storeIds() != null) {
            for (Integer storeId : req.storeIds()) {
                var store = stores.findById(storeId).orElseThrow(() -> ApiException.notFound("Store"));
                joins.save(new StoreTenant(storeId, t.getTenantId()));
                store.setStatus("occupied");
            }
        }
        return toResponse(t);
    }

    @Transactional
    public void delete(Integer id) {
        var t = tenants.findById(id).orElseThrow(() -> ApiException.notFound("Tenant"));
        List<Integer> owned = storeIds(id);
        joins.findByIdTenantId(id).forEach(joins::delete);
        tenants.delete(t);
        for (Integer storeId : owned) {
            if (joins.findByIdStoreId(storeId).isEmpty()) {
                stores.findById(storeId).ifPresent(s -> s.setStatus("available"));
            }
        }
    }

    public List<MallDtos.StoreResponse> storesByTenant(Integer tenantId) {
        tenants.findById(tenantId).orElseThrow(() -> ApiException.notFound("Tenant"));
        return storeIds(tenantId).stream()
                .map(sid -> stores.findById(sid).orElse(null))
                .filter(s -> s != null)
                .map(StoreService::toResponse).toList();
    }

    public List<PeopleDtos.EmployeeResponse> employeesByTenant(Integer tenantId) {
        return storesByTenant(tenantId).stream()
                .flatMap(s -> employees.findByStoreId(s.storeId()).stream())
                .map(EmployeeService::toResponse).toList();
    }

    public List<PeopleDtos.TransactionResponse> transactionsByTenant(Integer tenantId) {
        var t = tenants.findById(tenantId).orElseThrow(() -> ApiException.notFound("Tenant"));
        return transactions.findBySender(t.getBusinessName()).stream()
                .map(TenantService::toResponse).toList();
    }

    List<Integer> storeIds(Integer tenantId) {
        return joins.findByIdTenantId(tenantId).stream()
                .map(j -> j.getId().getStoreId()).toList();
    }

    PeopleDtos.TenantResponse toResponse(Tenant t) {
        return new PeopleDtos.TenantResponse(t.getTenantId(), t.getBusinessName(),
                t.getBusinessType(), t.getEmail(), t.getDateRegistered(),
                t.getPhoneNumber(), storeIds(t.getTenantId()));
    }

    static PeopleDtos.TransactionResponse toResponse(com.mallhub.entity.FinancialTransaction tx) {
        return new PeopleDtos.TransactionResponse(tx.getTransactionId(), tx.getAmount(),
                tx.getSender(), tx.getReceiver(), tx.getSenderType(), tx.getReceiverType(),
                tx.getTransactionDate(), tx.getRemarks());
    }
}
