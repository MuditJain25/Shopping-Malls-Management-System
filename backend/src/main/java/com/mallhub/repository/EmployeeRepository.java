package com.mallhub.repository;

import com.mallhub.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    List<Employee> findByStoreId(Integer storeId);
    List<Employee> findByMallId(Integer mallId);
    Optional<Employee> findByEmail(String email);
}
