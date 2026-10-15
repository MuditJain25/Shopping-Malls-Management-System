package com.mallhub.controller;

import com.mallhub.dto.MallDtos;
import com.mallhub.entity.Product;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
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
    public MallDtos.ProductResponse create(@Valid @RequestBody MallDtos.ProductCreateRequest req) {
        var p = new Product();
        p.setProductName(req.productName());
        p.setCategory(req.category());
        p.setPrice(req.price());
        p.setImageUrl(req.imageUrl());
        return toResponse(products.save(p));
    }

    // toShow/store stay null: a catalog row is not scoped to one store.
    private static MallDtos.ProductResponse toResponse(Product p) {
        return new MallDtos.ProductResponse(p.getProductId(), p.getProductName(),
                p.getCategory(), p.getPrice(), p.getImageUrl(), null, null);
    }
}