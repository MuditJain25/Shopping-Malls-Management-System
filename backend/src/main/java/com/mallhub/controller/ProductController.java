package com.mallhub.controller;

import com.mallhub.dto.MallDtos;
import com.mallhub.entity.Product;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.ProductRepository;
import com.mallhub.repository.StoreProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;
    private final StoreProductRepository links;

    public ProductController(ProductRepository products, StoreProductRepository links) {
        this.products = products;
        this.links = links;
    }

    @GetMapping
    public List<MallDtos.ProductResponse> list(@RequestParam(required = false) String search) {
        var rows = (search == null || search.isBlank())
                ? products.findAllByOrderByProductNameAsc()
                : products.search(search.trim());
        return rows.stream().map(ProductController::toResponse).toList();
    }

    @GetMapping("/{id}")
    public MallDtos.ProductResponse get(@PathVariable Integer id) {
        var p = products.findById(id).orElseThrow(() -> ApiException.notFound("Product"));
        return toResponse(p);
    }

    /** Catalog entry only - attaching it to a store is POST /api/stores/{id}/products/{pid}. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('TENANT','SHOP_MANAGER','MALL_MANAGER','EXECUTIVE')")
    public MallDtos.ProductResponse create(@Valid @RequestBody MallDtos.ProductCreateRequest req) {
        var p = new Product();
        p.setProductName(req.productName());
        p.setCategory(req.category());
        p.setPrice(req.price());
        p.setImageUrl(req.imageUrl());
        return toResponse(products.save(p));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EXECUTIVE')")
    public MallDtos.ProductResponse update(@PathVariable Integer id,
                                           @Valid @RequestBody MallDtos.ProductCreateRequest req) {
        var p = products.findById(id).orElseThrow(() -> ApiException.notFound("Product"));
        p.setProductName(req.productName());
        p.setCategory(req.category());
        p.setPrice(req.price());
        p.setImageUrl(req.imageUrl());
        return toResponse(p);
    }

    // Cascading is off: a catalog row still listed by a store cannot be deleted.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('EXECUTIVE')")
    public void delete(@PathVariable Integer id) {
        products.findById(id).orElseThrow(() -> ApiException.notFound("Product"));
        if (links.existsByIdProductId(id)) {
            throw ApiException.conflict("Product is still listed by a store");
        }
        products.deleteById(id);
    }

    // toShow/store stay null: a catalog row is not scoped to one store.
    private static MallDtos.ProductResponse toResponse(Product p) {
        return new MallDtos.ProductResponse(p.getProductId(), p.getProductName(),
                p.getCategory(), p.getPrice(), p.getImageUrl(), null, null);
    }
}