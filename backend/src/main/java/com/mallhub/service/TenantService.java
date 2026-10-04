package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.StoreTenant;
import com.mallhub.entity.Tenant;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    public Page<PeopleDtos.TenantResponse> list(Integer mallId, Pageable pageable) {
        Page<Tenant> page = mallId == null
                ? tenants.findAll(pageable) : tenants.findByMall(mallId, pageable);
        return new PageImpl<>(toResponses(page.getContent()), page.getPageable(),
                page.getTotalElements());
    }

    public PeopleDtos.TenantResponse get(Integer id) {
        return toResponse(require(id));
    }

    public Tenant require(Integer tenantId) {
        return tenants.findById(tenantId).orElseThrow(() -> ApiException.notFound("Tenant"));
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
        var t = require(id);
        List<Integer> owned = storeIds(id);
        joins.findByIdTenantId(id).forEach(joins::delete);
        tenants.delete(t);
        for (Integer storeId : owned) {
            if (!joins.existsByIdStoreId(storeId)) {
                stores.findById(storeId).ifPresent(s -> s.setStatus("available"));
            }
        }
    }

    public List<MallDtos.StoreResponse> storesByTenant(Integer tenantId) {
        require(tenantId);
        return stores.findByTenant(tenantId).stream().map(StoreService::toResponse).toList();
    }

    public boolean ownsStore(Integer tenantId, Integer storeId) {
        return joins.existsByIdTenantIdAndIdStoreId(tenantId, storeId);
    }

    public Page<PeopleDtos.EmployeeResponse> employeesByTenant(Integer tenantId, Pageable pageable) {
        require(tenantId);
        return employees.findByTenant(tenantId, pageable).map(EmployeeService::toResponse);
    }

    public Page<PeopleDtos.TransactionResponse> transactionsByTenant(Integer tenantId, Pageable pageable) {
        var t = require(tenantId);
        return transactions.findBySender(t.getBusinessName(), pageable).map(TenantService::toResponse);
    }

    List<Integer> storeIds(Integer tenantId) {
        return joins.findByIdTenantId(tenantId).stream()
                .map(j -> j.getId().getStoreId()).toList();
    }

    /** One join query for the whole page instead of one per tenant. */
    List<PeopleDtos.TenantResponse> toResponses(List<Tenant> batch) {
        if (batch.isEmpty()) return List.of();
        Map<Integer, List<Integer>> storeIdsByTenant = joins.findByIdTenantIdIn(
                        batch.stream().map(Tenant::getTenantId).toList()).stream()
                .collect(Collectors.groupingBy(j -> j.getId().getTenantId(),
                        Collectors.mapping(j -> j.getId().getStoreId(), Collectors.toList())));
        return batch.stream().map(t -> toResponse(t,
                        storeIdsByTenant.getOrDefault(t.getTenantId(), List.of())))
                .toList();
    }

    PeopleDtos.TenantResponse toResponse(Tenant t) {
        return toResponse(t, storeIds(t.getTenantId()));
    }

    private PeopleDtos.TenantResponse toResponse(Tenant t, List<Integer> storeIds) {
        return new PeopleDtos.TenantResponse(t.getTenantId(), t.getBusinessName(),
                t.getBusinessType(), t.getEmail(), t.getDateRegistered(),
                t.getPhoneNumber(), storeIds);
    }

    static PeopleDtos.TransactionResponse toResponse(com.mallhub.entity.FinancialTransaction tx) {
        return new PeopleDtos.TransactionResponse(tx.getTransactionId(), tx.getAmount(),
                tx.getSender(), tx.getReceiver(), tx.getSenderType(), tx.getReceiverType(),
                tx.getTransactionDate(), tx.getRemarks());
    }
}