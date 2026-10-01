package com.mallhub.repository;

import com.mallhub.entity.ExecutiveOverseesMall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OverseesRepository extends JpaRepository<ExecutiveOverseesMall, ExecutiveOverseesMall.Id> {
    List<ExecutiveOverseesMall> findByIdExecutiveId(Integer executiveId);
}
