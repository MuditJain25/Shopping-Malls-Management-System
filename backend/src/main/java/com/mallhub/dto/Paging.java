package com.mallhub.dto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

// Optional pagination: controllers return a plain list unless ?page= is given.
public final class Paging {
    private Paging() {
    }

    public static Pageable pageable(Integer page, Integer size, List<String> sorts) {
        Sort sort = Sort.unsorted();
        if (sorts != null) {
            for (String s : sorts) {
                String[] parts = s.split(",");
                sort = sort.and(Sort.by(
                        parts.length > 1 && parts[1].equalsIgnoreCase("desc")
                                ? Sort.Direction.DESC : Sort.Direction.ASC,
                        parts[0]));
            }
        }
        return PageRequest.of(page, Math.min(size == null ? 20 : size, 100), sort);
    }

    public static <T> Object wrap(List<T> all, Integer page, Integer size, List<String> sorts) {
        if (page == null) {
            return all;
        }
        Pageable p = pageable(page, size, sorts);
        int from = Math.min((int) p.getOffset(), all.size());
        int to = Math.min(from + p.getPageSize(), all.size());
        List<T> slice = all.subList(from, to);
        int totalPages = (int) Math.ceil((double) all.size() / p.getPageSize());
        Page<T> result = new org.springframework.data.domain.PageImpl<>(slice, p, all.size());
        return new PageEnvelope<>(result.getContent(), page, p.getPageSize(),
                all.size(), totalPages, page >= totalPages - 1);
    }
}
