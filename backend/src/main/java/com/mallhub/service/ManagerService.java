package com.mallhub.service;

import com.mallhub.dto.PeopleDtos;
import com.mallhub.entity.MallManager;
import com.mallhub.exception.ApiException;
import com.mallhub.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class ManagerService {
    private final MallManagerRepository managers;
    private final MallRepository malls;
    private final TenantRepository tenants;
    private final EmployeeRepository employees;
    private final ExecutiveRepository executives;

    public ManagerService(MallManagerRepository managers, MallRepository malls,
                          TenantRepository tenants, EmployeeRepository employees,
                          ExecutiveRepository executives) {
        this.managers = managers;
        this.malls = malls;
        this.tenants = tenants;
        this.employees = employees;
        this.executives = executives;
    }

    public Page<PeopleDtos.ManagerResponse> list(Pageable pageable) {
        return managers.findAll(pageable).map(ManagerService::toResponse);
    }

    public PeopleDtos.ManagerResponse get(Integer id) {
        return toResponse(managers.findById(id).orElseThrow(() -> ApiException.notFound("Manager")));
    }

    @Transactional
    public PeopleDtos.ManagerResponse create(PeopleDtos.ManagerCreateRequest req) {
        if (!malls.existsById(req.mallId())) throw ApiException.notFound("Mall");
        // Email is the login key: it must resolve to exactly one role.
        if (managers.findByEmail(req.email()).isPresent()
                || tenants.findByEmail(req.email()).isPresent()
                || employees.findByEmail(req.email()).isPresent()
                || executives.findByEmail(req.email()).isPresent()) {
            throw ApiException.conflict("Email is already registered with another role");
        }
        var m = new MallManager();
        m.setFirstName(req.firstName());
        m.setLastName(req.lastName());
        m.setEmail(req.email());
        m.setPhoneNumber(req.phoneNumber());
        m.setMallId(req.mallId());
        m.setDateJoined(LocalDate.now());
        return toResponse(managers.save(m));
    }

    static PeopleDtos.ManagerResponse toResponse(MallManager m) {
        return new PeopleDtos.ManagerResponse(m.getManagerId(), m.getFirstName(),
                m.getLastName(), m.getEmail(), m.getDateJoined(), m.getPhoneNumber(), m.getMallId());
    }
}