package com.mallhub;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Kept separate from the demo smoke test: this context turns authentication on,
// which is what activates the @PreAuthorize checks.
@SpringBootTest(properties = "app.auth.enabled=true")
@AutoConfigureMockMvc
@Transactional
class RoleSecurityTest {
    @Autowired
    MockMvc mvc;

    @Test
    void publicReadsStillWorkWithoutLogin() throws Exception {
        mvc.perform(get("/api/malls"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerCannotCreateMall() throws Exception {
        mvc.perform(post("/api/malls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Role Test City"}"""))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerCannotDeleteStore() throws Exception {
        mvc.perform(delete("/api/stores/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerCannotListManagers() throws Exception {
        mvc.perform(get("/api/managers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "MALL_MANAGER")
    void managerCanListTenants() throws Exception {
        mvc.perform(get("/api/tenants"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MALL_MANAGER")
    void managerCannotPlaceBid() throws Exception {
        mvc.perform(post("/api/bid-events/1/bids")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"user_id":1,"bid_amount":1000,"bidder_name":"Test"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "EXECUTIVE")
    void executiveCanCreateMall() throws Exception {
        mvc.perform(post("/api/malls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Role Test City"}"""))
                .andExpect(status().isCreated());
    }
}
