package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.RevenueInformation;
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
    private final RevenueRepository revenue;

    public TenantService(TenantRepository tenants, StoreTenantRepository joins,
                         StoreRepository stores, EmployeeRepository employees,
                         TransactionRepository transactions, RevenueRepository revenue) {
        this.tenants = tenants;
        this.joins = joins;
        this.stores = stores;
        this.employees = employees;
        this.transactions = transactions;
        this.revenue = revenue;
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
        return toResponse(tenants.save(t));
    }

    @Transactional
    public void delete(Integer id) {
        var t = require(id);
        if (!joins.findByIdTenantId(id).isEmpty()) {
            throw ApiException.conflict("Tenant is linked to one or more stores");
        }
        tenants.delete(t);
    }

    @Transactional
    public PeopleDtos.TenantResponse update(Integer id, PeopleDtos.TenantUpdateRequest req) {
        var t = require(id);
        t.setBusinessName(req.businessName());
        t.setBusinessType(req.businessType());
        t.setEmail(req.email());
        t.setPhoneNumber(req.phoneNumber());
        return toResponse(t);
    }

    public List<MallDtos.StoreResponse> storesByTenant(Integer tenantId) {
        require(tenantId);
        return stores.findByTenant(tenantId).stream().map(StoreService::toResponse).toList();
    }

    public boolean ownsStore(Integer tenantId, Integer storeId) {
        return joins.existsByIdTenantIdAndIdStoreId(tenantId, storeId);
    }

    @Transactional
    public PeopleDtos.TenantResponse linkStore(Integer tenantId, Integer storeId) {
        var t = require(tenantId);
        if (!stores.existsById(storeId)) throw ApiException.notFound("Store");
        if (ownsStore(tenantId, storeId)) {
            throw ApiException.conflict("Store already linked to this tenant");
        }
        joins.save(new StoreTenant(storeId, tenantId));
        return toResponse(t);
    }

    @Transactional
    public void unlinkStore(Integer tenantId, Integer storeId) {
        require(tenantId);
        var join = joins.findById(new StoreTenant.Id(storeId, tenantId))
                .orElseThrow(() -> ApiException.notFound("Link"));
        joins.delete(join);
    }

    public Page<PeopleDtos.EmployeeResponse> employeesByTenant(Integer tenantId, Pageable pageable) {
        require(tenantId);
        return employees.findByTenant(tenantId, pageable).map(EmployeeService::toResponse);
    }

    public Page<PeopleDtos.RevenueResponse> revenueByTenant(Integer tenantId, Pageable pageable) {
        require(tenantId);
        return revenue.findByIdTenantId(tenantId, pageable).map(TenantService::toRevenue);
    }

    @Transactional
    public PeopleDtos.RevenueResponse submitRevenue(Integer tenantId,
                                                    PeopleDtos.RevenueCreateRequest req) {
        require(tenantId);
        int next = revenue.findMaxInformationId(tenantId) + 1;
        var row = new RevenueInformation();
        row.setId(new RevenueInformation.Id(tenantId, next));
        row.setDescription(req.description());
        revenue.save(row);
        return toRevenue(row);
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

    static PeopleDtos.RevenueResponse toRevenue(RevenueInformation r) {
        return new PeopleDtos.RevenueResponse(r.getId().getTenantId(), r.getId().getInformationId(),
                r.getDescription());
    }
}