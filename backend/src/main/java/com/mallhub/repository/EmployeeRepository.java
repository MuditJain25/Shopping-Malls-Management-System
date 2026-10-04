package com.mallhub.repository;

import com.mallhub.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    Optional<Employee> findByEmail(String email);

    Page<Employee> findByMallId(Integer mallId, Pageable pageable);

    Page<Employee> findByMallIdAndStoreId(Integer mallId, Integer storeId, Pageable pageable);

    Page<Employee> findByStoreId(Integer storeId, Pageable pageable);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.storeId IN (SELECT st.id.storeId FROM StoreTenant st WHERE st.id.tenantId = :tenantId)
            """)
    Page<Employee> findByTenant(@Param("tenantId") Integer tenantId, Pageable pageable);
}