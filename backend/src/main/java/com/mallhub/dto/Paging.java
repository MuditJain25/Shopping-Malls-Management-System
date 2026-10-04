package com.mallhub.dto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

// Filtering, ordering and limiting are done by the database; this only builds the Pageable
// and picks the response shape (bare array unless ?page= was requested).
public final class Paging {
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private Paging() {
    }

    /**
     * @param defaultSort entity property to order by. Always applied: LIMIT/OFFSET over an
     *                    unordered query returns overlapping and missing rows across pages.
     */
    public static Pageable pageable(Integer page, Integer size, String defaultSort) {
        Sort sort = Sort.by(defaultSort);
        return page == null
                ? PageRequest.of(0, Integer.MAX_VALUE, sort)
                : PageRequest.of(page, clamp(size), sort);
    }

    private static int clamp(Integer size) {
        if (size == null) return DEFAULT_SIZE;
        return Math.min(Math.max(size, 1), MAX_SIZE);
    }

    public static <T> Object shape(Page<T> result, Integer requestedPage) {
        if (requestedPage == null) {
            return result.getContent();
        }
        return new PageEnvelope<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }
}