package com.mallhub.repository;

import com.mallhub.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Integer> {
    List<Store> findByMallId(Integer mallId);
    List<Store> findByMallIdAndStatus(Integer mallId, String status);
    List<Store> findByStatus(String status);
}
