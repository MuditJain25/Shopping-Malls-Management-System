package com.mallhub.repository;

import com.mallhub.entity.MallContactNumber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MallContactNumberRepository extends JpaRepository<MallContactNumber, MallContactNumber.Id> {
    List<MallContactNumber> findByIdMallId(Integer mallId);

    List<MallContactNumber> findByIdMallIdIn(List<Integer> mallIds);
}