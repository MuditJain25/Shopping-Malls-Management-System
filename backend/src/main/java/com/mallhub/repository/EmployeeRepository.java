package com.mallhub.repository;

import com.mallhub.entity.Employee;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    Optional<Employee> findByEmail(String email);

    List<Employee> findByMallId(Integer mallId, Sort sort);

    List<Employee> findByMallIdAndStoreId(Integer mallId, Integer storeId, Sort sort);

    List<Employee> findByStoreIdOrderByEmployeeIdAsc(Integer storeId);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.storeId IN (SELECT st.id.storeId FROM StoreTenant st WHERE st.id.tenantId = :tenantId)
            """)
    List<Employee> findByTenant(@Param("tenantId") Integer tenantId, Sort sort);
}