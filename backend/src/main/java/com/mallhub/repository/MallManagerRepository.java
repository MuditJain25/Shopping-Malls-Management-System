package com.mallhub.repository;

import com.mallhub.entity.MallManager;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MallManagerRepository extends JpaRepository<MallManager, Integer> {
    Optional<MallManager> findByMallId(Integer mallId);
    Optional<MallManager> findByEmail(String email);
}
