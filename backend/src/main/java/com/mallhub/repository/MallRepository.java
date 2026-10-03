package com.mallhub.repository;

import com.mallhub.entity.Mall;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MallRepository extends JpaRepository<Mall, Integer> {
}
