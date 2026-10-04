package com.mallhub.repository;

import com.mallhub.entity.StoreTenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreTenantRepository extends JpaRepository<StoreTenant, StoreTenant.Id> {
    List<StoreTenant> findByIdTenantId(Integer tenantId);

    List<StoreTenant> findByIdTenantIdIn(List<Integer> tenantIds);

    boolean existsByIdStoreId(Integer storeId);

    boolean existsByIdTenantIdAndIdStoreId(Integer tenantId, Integer storeId);
}