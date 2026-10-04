package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.Mall;
import com.mallhub.entity.Store;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MallService {
    private final MallRepository malls;
    private final MallContactNumberRepository contacts;
    private final StoreRepository stores;
    private final ProductRepository products;
    private final MallManagerRepository managers;
    private final EmployeeRepository employees;
    private final OfferRepository offers;

    public MallService(MallRepository malls, MallContactNumberRepository contacts,
                       StoreRepository stores, ProductRepository products,
                       MallManagerRepository managers, EmployeeRepository employees,
                       OfferRepository offers) {
        this.malls = malls;
        this.contacts = contacts;
        this.stores = stores;
        this.products = products;
        this.managers = managers;
        this.employees = employees;
        this.offers = offers;
    }

    public Page<MallDtos.MallResponse> list(String q, String city, Pageable pageable) {
        Page<Mall> page = malls.search(blankToNull(q), blankToNull(city), pageable);
        return new PageImpl<>(toResponses(page.getContent()), page.getPageable(),
                page.getTotalElements());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    public MallDtos.MallResponse get(Integer id) {
        return toResponse(malls.findById(id).orElseThrow(() -> ApiException.notFound("Mall")));
    }

    public MallDtos.MallResponse toResponse(Mall m) {
        List<String> numbers = contacts.findByIdMallId(m.getMallId()).stream()
                .map(c -> c.getId().getContactNumber()).toList();
        return toResponse(m, numbers);
    }

    /** One contact-number query for the whole page instead of one per mall. */
    public List<MallDtos.MallResponse> toResponses(List<Mall> batch) {
        if (batch.isEmpty()) return List.of();
        Map<Integer, List<String>> byMall = contacts.findByIdMallIdIn(
                        batch.stream().map(Mall::getMallId).toList()).stream()
                .collect(Collectors.groupingBy(c -> c.getId().getMallId(),
                        Collectors.mapping(c -> c.getId().getContactNumber(), Collectors.toList())));
        return batch.stream()
                .map(m -> toResponse(m, byMall.getOrDefault(m.getMallId(), List.of())))
                .toList();
    }

    private MallDtos.MallResponse toResponse(Mall m, List<String> numbers) {
        return new MallDtos.MallResponse(m.getMallId(), m.getMallAreaSqft(), m.getOpeningDate(),
                m.getStreet(), m.getCity(), m.getState(), m.getPincode(),
                m.getLatitude(), m.getLongitude(), numbers, m.getImageUrl(), m.getDescription());
    }

    public Page<MallDtos.StoreResponse> storesByMall(Integer mallId, Pageable pageable) {
        ensureMall(mallId);
        return stores.findByMallId(mallId, pageable).map(StoreService::toResponse);
    }

    public List<MallDtos.ProductResponse> topProducts(Integer mallId) {
        ensureMall(mallId);
        return products.findTopSellingByMall(mallId).stream()
                .map(row -> {
                    var product = (com.mallhub.entity.Product) row[0];
                    var store = (Store) row[1];
                    return new MallDtos.ProductResponse(product.getProductId(),
                            product.getProductName(), product.getCategory(), product.getPrice(),
                            product.getImageUrl(), true, StoreService.toResponse(store));
                })
                .toList();
    }

    public PeopleDtos.ManagerResponse managerByMall(Integer mallId) {
        ensureMall(mallId);
        return managers.findByMallId(mallId)
                .map(m -> new PeopleDtos.ManagerResponse(m.getManagerId(),
                        m.getFirstName(), m.getLastName(), m.getEmail(), m.getDateJoined(),
                        m.getPhoneNumber(), m.getMallId()))
                .orElse(null);
    }

    public Page<PeopleDtos.EmployeeResponse> employeesByMall(Integer mallId, Integer storeId,
                                                            Pageable pageable) {
        ensureMall(mallId);
        return (storeId == null
                ? employees.findByMallId(mallId, pageable)
                : employees.findByMallIdAndStoreId(mallId, storeId, pageable))
                .map(EmployeeService::toResponse);
    }

    public Page<MallDtos.OfferResponse> offersByMall(Integer mallId, Pageable pageable) {
        ensureMall(mallId);
        return offers.findByMall(mallId, pageable).map(StoreService::toOffer);
    }

    public List<MallDtos.MallResponse> mallsByExecutive(Integer executiveId) {
        return toResponses(malls.findByExecutive(executiveId));
    }

    private void ensureMall(Integer mallId) {
        if (!malls.existsById(mallId)) throw ApiException.notFound("Mall");
    }
}