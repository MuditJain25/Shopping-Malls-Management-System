package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.entity.Store;
import com.mallhub.entity.StoreProduct;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StoreService {
    private final StoreRepository stores;
    private final ProductRepository products;
    private final StoreProductRepository links;
    private final EmployeeRepository employees;
    private final OfferRepository offers;

    public StoreService(StoreRepository stores, ProductRepository products,
                        StoreProductRepository links, EmployeeRepository employees,
                        OfferRepository offers) {
        this.stores = stores;
        this.products = products;
        this.links = links;
        this.employees = employees;
        this.offers = offers;
    }

    public static MallDtos.StoreResponse toResponse(Store s) {
        return new MallDtos.StoreResponse(s.getStoreId(), s.getShopNumber(), s.getFloor(),
                s.getAreaSqft(), s.getStoreName(), s.getStatus(), s.getListingMedia(), s.getMallId());
    }

    public List<MallDtos.StoreResponse> available(Integer mallId) {
        List<Store> all = mallId == null ? stores.findByStatus("available")
                : stores.findByMallIdAndStatus(mallId, "available");
        return all.stream().map(StoreService::toResponse).toList();
    }

    public MallDtos.StoreResponse get(Integer id) {
        return toResponse(stores.findById(id).orElseThrow(() -> ApiException.notFound("Store")));
    }

    public Store require(Integer id) {
        return stores.findById(id).orElseThrow(() -> ApiException.notFound("Store"));
    }

    public List<MallDtos.ProductResponse> productsByStore(Integer storeId) {
        require(storeId);
        return links.findByIdStoreId(storeId).stream()
                .map(sp -> products.findById(sp.getId().getProductId()).map(p ->
                        new MallDtos.ProductResponse(p.getProductId(), p.getProductName(),
                                p.getCategory(), p.getPrice(), p.getImageUrl(), sp.getToShow(), null))
                        .orElse(null))
                .filter(p -> p != null)
                .toList();
    }

    @Transactional
    public MallDtos.ProductResponse addProduct(Integer storeId, MallDtos.ProductCreateRequest req) {
        require(storeId);
        var p = new com.mallhub.entity.Product();
        p.setProductName(req.productName());
        p.setCategory(req.category());
        p.setPrice(req.price());
        p.setImageUrl(req.imageUrl());
        p = products.save(p);
        links.save(new StoreProduct(storeId, p.getProductId(), false));
        return new MallDtos.ProductResponse(p.getProductId(), p.getProductName(),
                p.getCategory(), p.getPrice(), p.getImageUrl(), false, null);
    }

    @Transactional
    public void setVisibility(Integer storeId, Integer productId, Boolean toShow) {
        var id = new StoreProduct.Id(storeId, productId);
        var link = links.findById(id).orElseThrow(() -> ApiException.notFound("Store product"));
        link.setToShow(toShow != null && toShow);
    }

    public List<com.mallhub.dto.PeopleDtos.EmployeeResponse> employeesByStore(Integer storeId) {
        require(storeId);
        return employees.findByStoreId(storeId).stream().map(EmployeeService::toResponse).toList();
    }

    public List<MallDtos.OfferResponse> offersByStore(Integer storeId) {
        require(storeId);
        return offers.findByIdStoreId(storeId).stream().map(StoreService::toOffer).toList();
    }

    @Transactional
    public MallDtos.OfferResponse createOffer(Integer storeId, MallDtos.OfferCreateRequest req) {
        require(storeId);
        // Per-store sequence; manual inserts must use ids >= 90000 (see DESIGN §6-D11).
        int next = offers.findByIdStoreId(storeId).stream()
                .mapToInt(o -> o.getId().getOfferId()).max().orElse(0) + 1;
        var o = new com.mallhub.entity.DiscountOffer();
        o.setId(new com.mallhub.entity.DiscountOffer.Id(storeId, next));
        o.setStartDate(req.startDate());
        o.setEndDate(req.endDate());
        o.setDescription(req.description());
        offers.save(o);
        return toOffer(o);
    }

    @Transactional
    public MallDtos.OfferResponse updateOffer(Integer storeId, Integer offerId, MallDtos.OfferCreateRequest req) {
        var o = offers.findById(new com.mallhub.entity.DiscountOffer.Id(storeId, offerId))
                .orElseThrow(() -> ApiException.notFound("Offer"));
        o.setStartDate(req.startDate());
        o.setEndDate(req.endDate());
        o.setDescription(req.description());
        return toOffer(o);
    }

    @Transactional
    public void deleteOffer(Integer storeId, Integer offerId) {
        var id = new com.mallhub.entity.DiscountOffer.Id(storeId, offerId);
        if (!offers.existsById(id)) throw ApiException.notFound("Offer");
        offers.deleteById(id);
    }

    static MallDtos.OfferResponse toOffer(com.mallhub.entity.DiscountOffer o) {
        return new MallDtos.OfferResponse(o.getId().getStoreId(), o.getId().getOfferId(),
                o.getStartDate(), o.getEndDate(), o.getDescription());
    }
}
