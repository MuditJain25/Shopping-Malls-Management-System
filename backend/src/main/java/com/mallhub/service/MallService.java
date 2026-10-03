package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class MallService {
    private final MallRepository malls;
    private final MallContactNumberRepository contacts;
    private final StoreRepository stores;
    private final StoreProductRepository storeProducts;
    private final ProductRepository products;
    private final MallManagerRepository managers;
    private final EmployeeRepository employees;
    private final BidEventRepository events;
    private final OfferRepository offers;

    public MallService(MallRepository malls, MallContactNumberRepository contacts,
                       StoreRepository stores, StoreProductRepository storeProducts,
                       ProductRepository products, MallManagerRepository managers,
                       EmployeeRepository employees, BidEventRepository events,
                       OfferRepository offers) {
        this.malls = malls;
        this.contacts = contacts;
        this.stores = stores;
        this.storeProducts = storeProducts;
        this.products = products;
        this.managers = managers;
        this.employees = employees;
        this.events = events;
        this.offers = offers;
    }

    public List<MallDtos.MallResponse> list(String q, String city) {
        return malls.findAll().stream()
                .filter(m -> city == null || m.getCity().equalsIgnoreCase(city))
                .filter(m -> q == null || matches(m, q))
                .sorted(Comparator.comparing(m -> m.getMallId()))
                .map(this::toResponse)
                .toList();
    }

    private boolean matches(com.mallhub.entity.Mall m, String q) {
        String needle = q.toLowerCase();
        return (m.getCity() != null && m.getCity().toLowerCase().contains(needle))
                || (m.getState() != null && m.getState().toLowerCase().contains(needle))
                || (m.getDescription() != null && m.getDescription().toLowerCase().contains(needle));
    }

    public MallDtos.MallResponse get(Integer id) {
        return toResponse(malls.findById(id).orElseThrow(() -> ApiException.notFound("Mall")));
    }

    public MallDtos.MallResponse toResponse(com.mallhub.entity.Mall m) {
        List<String> numbers = contacts.findByIdMallId(m.getMallId()).stream()
                .map(c -> c.getId().getContactNumber()).toList();
        return new MallDtos.MallResponse(m.getMallId(), m.getMallAreaSqft(), m.getOpeningDate(),
                m.getStreet(), m.getCity(), m.getState(), m.getPincode(),
                m.getLatitude(), m.getLongitude(), numbers, m.getImageUrl(), m.getDescription());
    }

    public List<MallDtos.StoreResponse> storesByMall(Integer mallId) {
        ensureMall(mallId);
        return stores.findByMallId(mallId).stream().map(StoreService::toResponse).toList();
    }

    public List<MallDtos.ProductResponse> topProducts(Integer mallId) {
        ensureMall(mallId);
        List<Integer> mallStoreIds = stores.findByMallId(mallId).stream()
                .map(com.mallhub.entity.Store::getStoreId).toList();
        return storeProducts.findAll().stream()
                .filter(sp -> Boolean.TRUE.equals(sp.getToShow()) && mallStoreIds.contains(sp.getId().getStoreId()))
                .map(sp -> {
                    var product = products.findById(sp.getId().getProductId()).orElse(null);
                    var store = stores.findById(sp.getId().getStoreId()).orElse(null);
                    if (product == null) return null;
                    return new MallDtos.ProductResponse(product.getProductId(), product.getProductName(),
                            product.getCategory(), product.getPrice(), product.getImageUrl(),
                            true, store == null ? null : StoreService.toResponse(store));
                })
                .filter(p -> p != null)
                .toList();
    }

    public Object managerByMall(Integer mallId) {
        ensureMall(mallId);
        return managers.findByMallId(mallId)
                .map(m -> new com.mallhub.dto.PeopleDtos.ManagerResponse(m.getManagerId(),
                        m.getFirstName(), m.getLastName(), m.getEmail(), m.getDateJoined(),
                        m.getPhoneNumber(), m.getMallId()))
                .orElse(null);
    }

    private void ensureMall(Integer mallId) {
        if (!malls.existsById(mallId)) throw ApiException.notFound("Mall");
    }
}
