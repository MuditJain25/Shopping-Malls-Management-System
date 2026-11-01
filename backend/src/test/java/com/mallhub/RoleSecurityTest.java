package com.mallhub;

import com.jayway.jsonpath.JsonPath;
import com.mallhub.security.AppTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Kept separate from the demo smoke test: this context turns authentication on,
// which is what activates the @PreAuthorize checks. Tokens are real JWTs so the
// ownership checks see the same profile ids the app issues at login.
@SpringBootTest(properties = "app.auth.enabled=true")
@AutoConfigureMockMvc
@Transactional
class RoleSecurityTest {
    @Autowired
    MockMvc mvc;

    @Autowired
    AppTokenProvider tokens;

    private String auth(String role, int profileId) {
        return "Bearer " + tokens.issue(role + "@role.test", role, profileId);
    }

    @Test
    void publicReadsStillWorkWithoutLogin() throws Exception {
        mvc.perform(get("/api/malls"))
                .andExpect(status().isOk());
    }

    @Test
    void customerCannotCreateMall() throws Exception {
        mvc.perform(post("/api/malls")
                        .header("Authorization", auth("customer", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Role Test City"}"""))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void customerCannotDeleteStore() throws Exception {
        mvc.perform(delete("/api/stores/1")
                        .header("Authorization", auth("customer", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotListManagers() throws Exception {
        mvc.perform(get("/api/managers")
                        .header("Authorization", auth("customer", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanListOwnMallTenants() throws Exception {
        mvc.perform(get("/api/tenants")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isOk());
    }

    @Test
    void managerCannotListAnotherMallsTenants() throws Exception {
        mvc.perform(get("/api/tenants")
                        .param("mallId", "2")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCannotDeleteAnotherMallsStore() throws Exception {
        mvc.perform(delete("/api/stores/7")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanCreateAndDeleteStoreInOwnMall() throws Exception {
        MvcResult created = mvc.perform(post("/api/stores")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_name":"Role Test Store","mall_id":1}"""))
                .andExpect(status().isCreated())
                .andReturn();
        Integer storeId = JsonPath.read(created.getResponse().getContentAsString(), "$.store_id");

        mvc.perform(delete("/api/stores/" + storeId)
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void managerCannotCreateStoreInAnotherMall() throws Exception {
        mvc.perform(post("/api/stores")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_name":"Role Test Store","mall_id":2}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCannotReadAnotherMallsEmployees() throws Exception {
        mvc.perform(get("/api/malls/2/employees")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCannotPlaceBid() throws Exception {
        mvc.perform(post("/api/bid-events/1/bids")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"user_id":1,"bid_amount":1000,"bidder_name":"Test"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotPlaceBidAsAnotherUser() throws Exception {
        mvc.perform(post("/api/bid-events/1/bids")
                        .header("Authorization", auth("customer", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"user_id":2,"bid_amount":10000,"bidder_name":"Test"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCanPlaceBidAsSelf() throws Exception {
        mvc.perform(post("/api/bid-events/1/bids")
                        .header("Authorization", auth("customer", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"user_id":1,"bid_amount":10000,"bidder_name":"Alex Morgan"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user_id").value(1));
    }

    @Test
    void customerCannotListAnotherUsersBids() throws Exception {
        mvc.perform(get("/api/bids")
                        .param("userId", "2")
                        .header("Authorization", auth("customer", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCanListOwnBids() throws Exception {
        mvc.perform(get("/api/bids")
                        .param("userId", "1")
                        .header("Authorization", auth("customer", 1)))
                .andExpect(status().isOk());
    }

    @Test
    void tenantCanUpdateOwnTenant() throws Exception {
        mvc.perform(put("/api/tenants/1")
                        .header("Authorization", auth("tenant", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"business_name":"Urban Threads LLC Updated","business_type":"Fashion Retail",
                                 "email":"tenant.demo@gmail.com","phone_number":"+1-212-555-1001"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.business_name").value("Urban Threads LLC Updated"));
    }

    @Test
    void tenantCannotUpdateAnotherTenant() throws Exception {
        mvc.perform(put("/api/tenants/2")
                        .header("Authorization", auth("tenant", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"business_name":"Hijacked"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanUpdateTenantInOwnMall() throws Exception {
        mvc.perform(put("/api/tenants/1")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"business_name":"Urban Threads LLC","business_type":"Fashion Retail",
                                 "email":"tenant.demo@gmail.com","phone_number":"+1-212-555-1001"}"""))
                .andExpect(status().isOk());
    }

    @Test
    void shopManagerCannotReadAnotherStoresEmployee() throws Exception {
        mvc.perform(get("/api/employees/6")
                        .header("Authorization", auth("shop_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCannotReadAnotherEmployee() throws Exception {
        mvc.perform(get("/api/employees/1")
                        .header("Authorization", auth("employee", 2)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCanReadSelf() throws Exception {
        mvc.perform(get("/api/employees/2")
                        .header("Authorization", auth("employee", 2)))
                .andExpect(status().isOk());
    }

    @Test
    void tenantCannotReadAnotherTenantsEmployees() throws Exception {
        mvc.perform(get("/api/tenants/2/employees")
                        .header("Authorization", auth("tenant", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void tenantCannotSubmitRevenueForAnotherTenant() throws Exception {
        mvc.perform(post("/api/tenants/2/revenue")
                        .header("Authorization", auth("tenant", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Role test"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void tenantCanSubmitOwnRevenue() throws Exception {
        mvc.perform(post("/api/tenants/1/revenue")
                        .header("Authorization", auth("tenant", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Role test"}"""))
                .andExpect(status().isCreated());
    }

    private ResultActions send(MockHttpServletRequestBuilder req, String role, int id, String body)
            throws Exception {
        return mvc.perform(req.header("Authorization", auth(role, id))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    // ── mall-only employees ────────────────────────────────────────
    @Test
    void managerAndExecutiveCanCreateMallOnlyEmployee() throws Exception {
        for (String[] who : new String[][]{{"mall_manager", "1"}, {"executive", "1"}}) {
            send(post("/api/employees"), who[0], Integer.parseInt(who[1]),
                    "{\"first_name\":\"Mall\",\"last_name\":\"Staff\",\"mall_id\":1}")
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.store_id").doesNotExist())
                    .andExpect(jsonPath("$.mall_id").value(1));
        }
    }

    @Test
    void tenantAndShopManagerCannotCreateMallOnlyEmployee() throws Exception {
        String body = "{\"first_name\":\"Mall\",\"last_name\":\"Staff\",\"mall_id\":1}";
        send(post("/api/employees"), "tenant", 1, body).andExpect(status().isForbidden());
        send(post("/api/employees"), "shop_manager", 1, body).andExpect(status().isForbidden());
    }

    @Test
    void managerCannotCreateMallOnlyEmployeeInAnotherMall() throws Exception {
        send(post("/api/employees"), "mall_manager", 1,
                "{\"first_name\":\"Mall\",\"last_name\":\"Staff\",\"mall_id\":2}")
                .andExpect(status().isForbidden());
    }

    @Test
    void createEmployeeWithoutStoreOrMallIsBadRequest() throws Exception {
        send(post("/api/employees"), "mall_manager", 1,
                "{\"first_name\":\"No\",\"last_name\":\"Place\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void storeWinsOverMallWhenBothGiven() throws Exception {
        send(post("/api/employees"), "executive", 1,
                "{\"first_name\":\"Both\",\"last_name\":\"Ids\",\"store_id\":9,\"mall_id\":2}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.store_id").value(9))
                .andExpect(jsonPath("$.mall_id").value(3));
    }

    @Test
    void managerCanMoveEmployeeToMallStaffButTenantCannot() throws Exception {
        String body = "{\"first_name\":\"Sarah\",\"last_name\":\"Johnson\",\"mall_id\":1}";
        send(put("/api/employees/2"), "tenant", 1, body).andExpect(status().isForbidden());
        send(put("/api/employees/2"), "shop_manager", 1, body).andExpect(status().isForbidden());
        send(put("/api/employees/2"), "mall_manager", 1, body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.store_id").doesNotExist());
        send(put("/api/employees/2"), "mall_manager", 2, body).andExpect(status().isForbidden());
    }

    @Test
    void executiveCanDeleteEmployee() throws Exception {
        mvc.perform(delete("/api/employees/7").header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void tenantEmployeeCreateStillNeedsOwnedStore() throws Exception {
        send(post("/api/tenants/1/employees"), "tenant", 1,
                "{\"first_name\":\"No\",\"last_name\":\"Store\",\"mall_id\":1}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void mallOnlyShopManagerCannotReadOtherStorelessEmployees() throws Exception {
        MvcResult created = send(post("/api/employees"), "executive", 1,
                "{\"first_name\":\"Floating\",\"last_name\":\"Boss\",\"current_designation\":\"Shop Manager\",\"mall_id\":3}")
                .andExpect(status().isCreated()).andReturn();
        int id = JsonPath.read(created.getResponse().getContentAsString(), "$.employee_id");
        mvc.perform(get("/api/employees/7").header("Authorization", auth("shop_manager", id)))
                .andExpect(status().isForbidden());
    }

    // ── transactions ───────────────────────────────────────────────
    @Test
    void anyOperatingRoleCanCreateTransactionWithOnlyAmount() throws Exception {
        for (String role : new String[]{"tenant", "shop_manager", "mall_manager", "executive"}) {
            send(post("/api/transactions"), role, 1, "{\"amount\":100}")
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.transaction_date").exists());
        }
    }

    @Test
    void customerCannotCreateTransaction() throws Exception {
        send(post("/api/transactions"), "customer", 1, "{\"amount\":100}")
                .andExpect(status().isForbidden());
    }

    @Test
    void transactionWithoutAmountIsRejected() throws Exception {
        send(post("/api/transactions"), "executive", 1, "{\"sender\":\"AC-1\"}")
                .andExpect(status().is4xxClientError());
    }

    @Test
    void onlyManagerAndExecutiveCanUpdateTransaction() throws Exception {
        String body = "{\"amount\":250,\"sender\":\"AC-1\",\"receiver\":\"AC-2\"}";
        send(put("/api/transactions/1"), "tenant", 1, body).andExpect(status().isForbidden());
        send(put("/api/transactions/1"), "shop_manager", 1, body).andExpect(status().isForbidden());
        send(put("/api/transactions/1"), "mall_manager", 1, body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sender").value("AC-1"))
                .andExpect(jsonPath("$.transaction_date").value("2026-08-01"));
        send(put("/api/transactions/1"), "executive", 1, body).andExpect(status().isOk());
        send(put("/api/transactions/99999"), "executive", 1, body).andExpect(status().isNotFound());
    }

    @Test
    void operatingRolesCanListTransactionsButCustomerCannot() throws Exception {
        for (String role : new String[]{"tenant", "shop_manager", "mall_manager", "executive"}) {
            mvc.perform(get("/api/transactions").header("Authorization", auth(role, 1)))
                    .andExpect(status().isOk());
        }
        mvc.perform(get("/api/transactions").header("Authorization", auth("customer", 1)))
                .andExpect(status().isForbidden());
    }

    // ── revenue ────────────────────────────────────────────────────
    @Test
    void tenantCanUpdateOwnRevenueOnly() throws Exception {
        MvcResult created = send(post("/api/tenants/1/revenue"), "tenant", 1,
                "{\"description\":\"v1\"}").andExpect(status().isCreated()).andReturn();
        int infoId = JsonPath.read(created.getResponse().getContentAsString(), "$.information_id");
        String path = "/api/tenants/1/revenue/" + infoId;
        send(put(path), "tenant", 1, "{\"description\":\"v2\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("v2"));
        send(put(path), "tenant", 2, "{\"description\":\"hijack\"}").andExpect(status().isForbidden());
        send(put("/api/tenants/1/revenue/99999"), "tenant", 1, "{\"description\":\"x\"}")
                .andExpect(status().isNotFound());
    }

    @Test
    void executiveCanCreateMall() throws Exception {
        mvc.perform(post("/api/malls")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Role Test City"}"""))
                .andExpect(status().isCreated());
    }

    @Test
    void executiveCanDeleteManager() throws Exception {
        mvc.perform(delete("/api/managers/3")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void managerCannotDeleteManager() throws Exception {
        mvc.perform(delete("/api/managers/1")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanLinkStoreInOwnMallToTenant() throws Exception {
        mvc.perform(post("/api/tenants/2/stores/3")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.store_ids").value(hasItem(3)));
    }

    @Test
    void managerCannotLinkAnotherMallsStore() throws Exception {
        mvc.perform(post("/api/tenants/1/stores/7")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void tenantCannotLinkStore() throws Exception {
        mvc.perform(post("/api/tenants/1/stores/3")
                        .header("Authorization", auth("tenant", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanUnlinkStoreAndRepeatUnlinkIs404() throws Exception {
        mvc.perform(delete("/api/tenants/1/stores/1")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isNoContent());

        mvc.perform(delete("/api/tenants/1/stores/1")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletingLinkedTenantConflicts() throws Exception {
        mvc.perform(delete("/api/tenants/1")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void executiveCanDeleteTenantAfterUnlinkingStores() throws Exception {
        mvc.perform(delete("/api/tenants/1/stores/1")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/tenants/1/stores/9")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());

        mvc.perform(delete("/api/tenants/1")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void executiveCanUpdateMall() throws Exception {
        mvc.perform(put("/api/malls/1")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Updated City","description":"Updated"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Updated City"));
    }

    @Test
    void managerCannotDeleteMall() throws Exception {
        mvc.perform(delete("/api/malls/1")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletingMallWithStoresConflicts() throws Exception {
        mvc.perform(delete("/api/malls/1")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void deletingMallWithManagerConflicts() throws Exception {
        MvcResult mall = mvc.perform(post("/api/malls")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Manager Mall"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        Integer mallId = JsonPath.read(mall.getResponse().getContentAsString(), "$.mall_id");

        mvc.perform(post("/api/managers")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Solo","last_name":"Manager","email":"solo.manager@role.test","mall_id":%d}"""
                                .formatted(mallId)))
                .andExpect(status().isCreated());

        mvc.perform(delete("/api/malls/" + mallId)
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void executiveCanDeleteEmptyMall() throws Exception {
        MvcResult mall = mvc.perform(post("/api/malls")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"city":"Empty City"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        Integer mallId = JsonPath.read(mall.getResponse().getContentAsString(), "$.mall_id");

        mvc.perform(delete("/api/malls/" + mallId)
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void executiveCanUpdateManager() throws Exception {
        mvc.perform(put("/api/managers/2")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Renamed","last_name":"Manager","email":"renamed.manager@role.test","mall_id":1}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.first_name").value("Renamed"))
                .andExpect(jsonPath("$.mall_id").value(1));
    }

    @Test
    void managerCannotUpdateManager() throws Exception {
        mvc.perform(put("/api/managers/2")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Renamed","last_name":"Manager","email":"renamed.manager@role.test","mall_id":1}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanUpdateOwnMallEmployee() throws Exception {
        mvc.perform(put("/api/employees/2")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Updated","last_name":"Employee","store_id":1}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.first_name").value("Updated"))
                .andExpect(jsonPath("$.store_id").value(1));
    }

    @Test
    void tenantCannotUpdateAnotherStoresEmployee() throws Exception {
        mvc.perform(put("/api/employees/3")
                        .header("Authorization", auth("tenant", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Hijacked","last_name":"Employee","store_id":2}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void executiveCanUpdateProduct() throws Exception {
        mvc.perform(put("/api/products/1")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"product_name":"Renamed Product","category":"Test","price":9.99}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product_name").value("Renamed Product"));
    }

    @Test
    void deletingListedProductConflicts() throws Exception {
        mvc.perform(delete("/api/products/1")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void executiveCanDeleteUnlistedProduct() throws Exception {
        MvcResult product = mvc.perform(post("/api/products")
                        .header("Authorization", auth("executive", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"product_name":"Orphan Product","category":"Test","price":1.00}"""))
                .andExpect(status().isCreated())
                .andReturn();
        Integer productId = JsonPath.read(product.getResponse().getContentAsString(), "$.product_id");

        mvc.perform(delete("/api/products/" + productId)
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void managerCannotDeleteProduct() throws Exception {
        mvc.perform(delete("/api/products/1")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletingBidEventWithBidsConflicts() throws Exception {
        mvc.perform(delete("/api/bid-events/1")
                        .header("Authorization", auth("executive", 1)))
                .andExpect(status().isConflict());
    }

    @Test
    void managerCanDeleteBidEventWithoutBids() throws Exception {
        MvcResult store = mvc.perform(post("/api/stores")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_name":"Delete Event Store","mall_id":1}"""))
                .andExpect(status().isCreated())
                .andReturn();
        Integer storeId = JsonPath.read(store.getResponse().getContentAsString(), "$.store_id");

        MvcResult event = mvc.perform(post("/api/bid-events")
                        .header("Authorization", auth("mall_manager", 1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_id":%d,"start_date":"2026-12-01","end_date":"2026-12-10","minimum_bid_amount":1000,"minimum_bid_increment":100}"""
                                .formatted(storeId)))
                .andExpect(status().isCreated())
                .andReturn();
        Integer eventId = JsonPath.read(event.getResponse().getContentAsString(), "$.event_id");

        mvc.perform(delete("/api/bid-events/" + eventId)
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void managerCannotDeleteAnotherMallsBidEvent() throws Exception {
        mvc.perform(delete("/api/bid-events/3")
                        .header("Authorization", auth("mall_manager", 1)))
                .andExpect(status().isForbidden());
    }
}
