package com.mallhub.service;

import com.mallhub.dto.MallDtos;
import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.Store;
import com.mallhub.entity.StoreProduct;
import com.mallhub.entity.StoreTenant;
import com.mallhub.entity.Tenant;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StoreService {
    private final StoreRepository stores;
    private final ProductRepository products;
    private final StoreProductRepository links;
    private final EmployeeRepository employees;
    private final OfferRepository offers;
    private final MallRepository malls;
    private final StoreTenantRepository joins;
    private final BidEventRepository bidEvents;
    private final BidRepository bids;

    public StoreService(StoreRepository stores, ProductRepository products,
                        StoreProductRepository links, EmployeeRepository employees,
                        OfferRepository offers, MallRepository malls,
                        StoreTenantRepository joins, BidEventRepository bidEvents,
                        BidRepository bids) {
        this.stores = stores;
        this.products = products;
        this.links = links;
        this.employees = employees;
        this.offers = offers;
        this.malls = malls;
        this.joins = joins;
        this.bidEvents = bidEvents;
        this.bids = bids;
    }

    public static MallDtos.StoreResponse toResponse(Store s) {
        return new MallDtos.StoreResponse(s.getStoreId(), s.getShopNumber(), s.getFloor(),
                s.getAreaSqft(), s.getStoreName(), s.getStatus(), s.getListingMedia(), s.getMallId());
    }

    public Page<MallDtos.StoreResponse> available(Integer mallId, Pageable pageable) {
        return (mallId == null
                ? stores.findByStatus("available", pageable)
                : stores.findByMallIdAndStatus(mallId, "available", pageable))
                .map(StoreService::toResponse);
    }

    public Page<MallDtos.StoreResponse> list(Integer mallId, String status, Pageable pageable) {
        return stores.search(mallId, normalizeStatus(status), pageable).map(StoreService::toResponse);
    }

    @Transactional
    public MallDtos.StoreResponse create(MallDtos.StoreCreateRequest req) {
        if (!malls.existsById(req.mallId())) throw ApiException.notFound("Mall");
        String status = normalizeStatus(req.status());
        if (status == null) status = "available";
        if ("occupied".equals(status)) {
            throw ApiException.badRequest("A new store cannot be occupied without a tenant");
        }
        var s = new Store();
        s.setStoreName(req.storeName());
        s.setMallId(req.mallId());
        s.setShopNumber(req.shopNumber());
        s.setFloor(req.floor());
        s.setAreaSqft(req.areaSqft());
        s.setListingMedia(req.listingMedia());
        s.setStatus(status);
        return toResponse(stores.save(s));
    }

    @Transactional
    public MallDtos.StoreResponse update(Integer id, MallDtos.StoreUpdateRequest req) {
        var s = require(id);
        if (!malls.existsById(req.mallId())) throw ApiException.notFound("Mall");
        String status = normalizeStatus(req.status());
        boolean hasTenant = joins.existsByIdStoreId(id);
        if (status == null) {
            status = s.getStatus();
        } else if ("available".equals(status) && hasTenant) {
            throw ApiException.conflict("Store has an active tenant");
        } else if ("occupied".equals(status) && !hasTenant) {
            throw ApiException.conflict("Store has no tenant");
        }
        boolean mallChanged = !Objects.equals(s.getMallId(), req.mallId());
        s.setStoreName(req.storeName());
        s.setMallId(req.mallId());
        s.setShopNumber(req.shopNumber());
        s.setFloor(req.floor());
        s.setAreaSqft(req.areaSqft());
        s.setListingMedia(req.listingMedia());
        s.setStatus(status);
        if (mallChanged) employees.updateMallIdByStoreId(req.mallId(), id);
        return toResponse(s);
    }

    @Transactional
    public void delete(Integer id) {
        require(id);
        if (joins.existsByIdStoreId(id)) {
            throw ApiException.conflict("Store has an active rental");
        }
        if (bidEvents.existsByIdStoreIdAndStatus(id, "open")) {
            throw ApiException.conflict("Store has an open bid event");
        }
        bids.deleteByStoreId(id);
        stores.deleteById(id);
    }

    public MallDtos.StoreResponse get(Integer id) {
        return toResponse(require(id));
    }

    public Store require(Integer id) {
        return stores.findById(id).orElseThrow(() -> ApiException.notFound("Store"));
    }

    public Page<MallDtos.ProductResponse> productsByStore(Integer storeId, Pageable pageable) {
        require(storeId);
        Page<StoreProduct> page = links.findByIdStoreId(storeId, pageable);
        // One extra query for the whole page instead of one per link.
        Map<Integer, com.mallhub.entity.Product> byId = products
                .findAllById(page.getContent().stream().map(l -> l.getId().getProductId()).toList())
                .stream().collect(Collectors.toMap(com.mallhub.entity.Product::getProductId,
                        Function.identity()));
        return new PageImpl<>(page.getContent().stream()
                .map(l -> {
                    var p = byId.get(l.getId().getProductId());
                    return p == null ? null : new MallDtos.ProductResponse(p.getProductId(),
                            p.getProductName(), p.getCategory(), p.getPrice(), p.getImageUrl(),
                            l.getToShow(), null);
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList()), page.getPageable(), page.getTotalElements());
    }

    @Transactional
    public MallDtos.ProductResponse attachProduct(Integer storeId, Integer productId, Boolean toShow) {
        require(storeId);
        var p = products.findById(productId).orElseThrow(() -> ApiException.notFound("Product"));
        // (store_id, product_id) is the composite PK; check first so the caller gets a
        // readable 409 instead of a raw duplicate-key SQL error.
        if (links.existsById(new StoreProduct.Id(storeId, productId))) {
            throw ApiException.conflict(
                    "Product " + productId + " is already linked to store " + storeId);
        }
        var link = links.save(new StoreProduct(storeId, productId, toShow != null && toShow));
        return new MallDtos.ProductResponse(p.getProductId(), p.getProductName(),
                p.getCategory(), p.getPrice(), p.getImageUrl(), link.getToShow(), null);
    }

    @Transactional
    public void setVisibility(Integer storeId, Integer productId, Boolean toShow) {
        var link = links.findById(new StoreProduct.Id(storeId, productId))
                .orElseThrow(() -> ApiException.notFound("Store product"));
        link.setToShow(toShow != null && toShow);
    }

    public Page<PeopleDtos.EmployeeResponse> employeesByStore(Integer storeId, Pageable pageable) {
        require(storeId);
        return employees.findByStoreId(storeId, pageable).map(EmployeeService::toResponse);
    }

    public Page<MallDtos.OfferResponse> offersByStore(Integer storeId, Pageable pageable) {
        require(storeId);
        return offers.findByIdStoreId(storeId, pageable).map(StoreService::toOffer);
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

    private static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return null;
        String normalized = status.toLowerCase();
        if (!normalized.equals("available") && !normalized.equals("occupied")) {
            throw ApiException.badRequest("status must be available or occupied");
        }
        return normalized;
    }
}