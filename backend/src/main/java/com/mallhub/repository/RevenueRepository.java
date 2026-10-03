package com.mallhub.repository;

import com.mallhub.entity.RevenueInformation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevenueRepository extends JpaRepository<RevenueInformation, RevenueInformation.Id> {
}
