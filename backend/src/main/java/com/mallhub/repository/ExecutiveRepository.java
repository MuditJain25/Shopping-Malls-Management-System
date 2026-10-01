package com.mallhub.repository;

import com.mallhub.entity.EnterpriseExecutive;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExecutiveRepository extends JpaRepository<EnterpriseExecutive, Integer> {
    Optional<EnterpriseExecutive> findByEmail(String email);
}
