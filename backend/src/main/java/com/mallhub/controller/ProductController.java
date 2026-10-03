package com.mallhub.controller;

import com.mallhub.dto.MallDtos;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping("/{id}")
    public MallDtos.ProductResponse get(@PathVariable Integer id) {
        var p = products.findById(id).orElseThrow(() -> ApiException.notFound("Product"));
        return new MallDtos.ProductResponse(p.getProductId(), p.getProductName(),
                p.getCategory(), p.getPrice(), p.getImageUrl(), null, null);
    }
}
