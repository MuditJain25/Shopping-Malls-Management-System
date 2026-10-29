package com.mallhub.security;

import com.mallhub.entity.Employee;
import com.mallhub.entity.MallManager;
import com.mallhub.entity.Store;
import com.mallhub.repository.BidEventRepository;
import com.mallhub.repository.EmployeeRepository;
import com.mallhub.repository.MallManagerRepository;
import com.mallhub.repository.StoreRepository;
import com.mallhub.repository.StoreTenantRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;

// Per-record ownership on top of the coarse role gates. Roles pick the endpoint;
// this picks the rows. Executives are global; everyone else is scoped to their own
// mall/tenant/store/employee. Method security is off in demo mode, but the direct
// calls (scopeMall) still no-op through the enabled flag.
@Component("access")
public class Access {
    private final boolean enabled;
    private final MallManagerRepository managers;
    private final StoreRepository stores;
    private final StoreTenantRepository joins;
    private final EmployeeRepository employees;
    private final BidEventRepository events;

    public Access(@Value("${app.auth.enabled:true}") boolean enabled,
                  MallManagerRepository managers, StoreRepository stores,
                  StoreTenantRepository joins, EmployeeRepository employees,
                  BidEventRepository events) {
        this.enabled = enabled;
        this.managers = managers;
        this.stores = stores;
        this.joins = joins;
        this.employees = employees;
        this.events = events;
    }

    public AuthPrincipal current() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof AuthPrincipal p ? p : null;
    }

    public boolean canAccessMall(Integer mallId) {
        if (!enabled) return true;
        AuthPrincipal p = current();
        if (p == null) return false;
        if (isExecutive(p)) return true;
        return isManager(p) && Objects.equals(managerMall(p), mallId);
    }

    // Executives keep the requested filter; a mall manager is pinned to their own mall.
    public Integer scopeMall(Integer mallId) {
        if (!enabled) return mallId;
        AuthPrincipal p = current();
        if (p == null) throw denied();
        if (isExecutive(p)) return mallId;
        if (isManager(p)) {
            Integer own = managerMall(p);
            if (own == null) throw denied();
            if (mallId != null && !mallId.equals(own)) throw denied();
            return own;
        }
        throw denied();
    }

    public boolean canAccessStore(Integer storeId) {
        if (!enabled) return true;
        AuthPrincipal p = current();
        if (p == null) return false;
        if (isExecutive(p)) return true;
        if (isManager(p)) {
            return stores.findById(storeId)
                    .map(s -> Objects.equals(s.getMallId(), managerMall(p)))
                    .orElse(false);
        }
        if (isTenant(p)) {
            return joins.existsByIdTenantIdAndIdStoreId(p.profileId(), storeId);
        }
        if (isShopManager(p)) {
            return Objects.equals(storeOf(p), storeId);
        }
        return false;
    }

    // A store edit may pick a mall: managers stay in their mall, tenants cannot move
    // an existing store out of its mall.
    public boolean canWriteStore(Integer storeId, Integer mallId) {
        if (!enabled) return true;
        if (!canAccessStore(storeId)) return false;
        AuthPrincipal p = current();
        if (isExecutive(p)) return true;
        if (isManager(p)) return Objects.equals(managerMall(p), mallId);
        return stores.findById(storeId)
                .map(s -> Objects.equals(s.getMallId(), mallId))
                .orElse(false);
    }

    public boolean canAccessTenant(Integer tenantId) {
        if (!enabled) return true;
        AuthPrincipal p = current();
        if (p == null) return false;
        if (isExecutive(p)) return true;
        if (isTenant(p)) return Objects.equals(p.profileId(), tenantId);
        if (isManager(p)) {
            Integer own = managerMall(p);
            return joins.findByIdTenantId(tenantId).stream()
                    .map(j -> stores.findById(j.getId().getStoreId())
                            .map(Store::getMallId).orElse(null))
                    .anyMatch(id -> Objects.equals(own, id));
        }
        return false;
    }

    public boolean canAccessEmployee(Integer employeeId) {
        if (!enabled) return true;
        AuthPrincipal p = current();
        if (p == null) return false;
        if (isExecutive(p)) return true;
        Employee target = employees.findById(employeeId).orElse(null);
        if (target == null) return false;
        if (isEmployee(p)) return Objects.equals(p.profileId(), employeeId);
        if (isShopManager(p)) {
            return Objects.equals(p.profileId(), employeeId)
                    || Objects.equals(storeOf(p), target.getStoreId());
        }
        if (isTenant(p)) {
            return target.getStoreId() != null
                    && joins.existsByIdTenantIdAndIdStoreId(p.profileId(), target.getStoreId());
        }
        return isManager(p) && Objects.equals(target.getMallId(), managerMall(p));
    }

    public boolean canAccessManager(Integer managerId) {
        if (!enabled) return true;
        AuthPrincipal p = current();
        if (p == null) return false;
        return isExecutive(p) || (isManager(p) && Objects.equals(p.profileId(), managerId));
    }

    public boolean canAccessEvent(Integer eventId) {
        if (!enabled) return true;
        return events.findByIdEventId(eventId).stream().findFirst()
                .map(e -> canAccessStore(e.getId().getStoreId()))
                .orElse(false);
    }

    // JWT profileId is user_id for customers; a caller can only act as themselves.
    public boolean isSelf(Integer id) {
        if (!enabled) return true;
        AuthPrincipal p = current();
        return p != null && Objects.equals(p.profileId(), id);
    }

    private Integer managerMall(AuthPrincipal p) {
        return managers.findById(p.profileId())
                .map(MallManager::getMallId)
                .orElse(null);
    }

    private Integer storeOf(AuthPrincipal p) {
        return employees.findById(p.profileId())
                .map(Employee::getStoreId)
                .orElse(null);
    }

    private static boolean isExecutive(AuthPrincipal p) {
        return "executive".equals(p.role());
    }

    private static boolean isManager(AuthPrincipal p) {
        return "mall_manager".equals(p.role());
    }

    private static boolean isTenant(AuthPrincipal p) {
        return "tenant".equals(p.role());
    }

    private static boolean isEmployee(AuthPrincipal p) {
        return "employee".equals(p.role());
    }

    private static boolean isShopManager(AuthPrincipal p) {
        return "shop_manager".equals(p.role());
    }

    private static AccessDeniedException denied() {
        return new AccessDeniedException("Forbidden");
    }
}
