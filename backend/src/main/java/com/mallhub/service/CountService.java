package com.mallhub.service;

import com.mallhub.exception.ApiException;
import com.mallhub.repository.CountRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CountService {
    private static final List<String> METRICS = List.of("tenants", "stores", "employees", "products");

    private final CountRepository counts;

    public CountService(CountRepository counts) {
        this.counts = counts;
    }

    /** {metric: n} for overall (mallId null) or one mall; only the requested metrics are queried. */
    public Map<String, Long> count(Integer mallId, String include) {
        Map<String, Long> out = new LinkedHashMap<>();
        for (String m : parse(include)) {
            out.put(m, mallId == null ? overall(m) : inMall(m, mallId));
        }
        return out;
    }

    /** One row per mall: {mall_id, metric: n, ...}. Counts come from GROUP BY queries; this only zips them by mall. */
    public Collection<Map<String, Object>> countByMall(String groupBy, String include) {
        if (!"mall".equals(groupBy)) throw ApiException.badRequest("groupBy must be 'mall'");
        Map<Object, Map<String, Object>> rows = new LinkedHashMap<>();
        for (String m : parse(include)) {
            for (Object[] r : byMall(m)) {
                rows.computeIfAbsent(r[0], id -> new LinkedHashMap<>(Map.of("mall_id", id))).put(m, r[1]);
            }
        }
        return rows.values();
    }

    private Collection<String> parse(String include) {
        if (include == null || include.isBlank()) return METRICS;
        Set<String> out = new LinkedHashSet<>();
        for (String m : include.split(",")) {
            m = m.trim();
            if (!METRICS.contains(m)) throw ApiException.badRequest("Unknown count '" + m + "'; use " + METRICS);
            out.add(m);
        }
        return out;
    }

    private long overall(String m) {
        return switch (m) {
            case "tenants" -> counts.tenants();
            case "stores" -> counts.stores();
            case "employees" -> counts.employees();
            default -> counts.products();
        };
    }

    private long inMall(String m, Integer mallId) {
        return switch (m) {
            case "tenants" -> counts.tenantsInMall(mallId);
            case "stores" -> counts.storesInMall(mallId);
            case "employees" -> counts.employeesInMall(mallId);
            default -> counts.productsInMall(mallId);
        };
    }

    private List<Object[]> byMall(String m) {
        return switch (m) {
            case "tenants" -> counts.tenantsByMall();
            case "stores" -> counts.storesByMall();
            case "employees" -> counts.employeesByMall();
            default -> counts.productsByMall();
        };
    }
}
