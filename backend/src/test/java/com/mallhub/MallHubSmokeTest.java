package com.mallhub;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
// Rolls back the rows the write tests create, so the demo seed stays clean.
@Transactional
class MallHubSmokeTest {
    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Test
    void healthIsUp() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void mallsSeeded() throws Exception {
        mvc.perform(get("/api/malls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void productCatalogLists() throws Exception {
        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }

    @Test
    void productSearchMatchesNameOrCategory() throws Exception {
        mvc.perform(get("/api/products").param("search", "zzzznope"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/products").param("search", "Electronics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }

    @Test
    void productCreateReturnsCreatedAndNoStoreLink() throws Exception {
        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"product_name":"Smoke Test Widget","category":"Electronics","price":499}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.product_name").value("Smoke Test Widget"))
                .andExpect(jsonPath("$.to_show").doesNotExist());
    }

    @Test
    void linkingSameProductTwiceConflicts() throws Exception {
        var created = mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"product_name":"Smoke Test Linkable","category":"Books","price":10}"""))
                .andExpect(status().isCreated())
                .andReturn();
        int pid = json.readTree(created.getResponse().getContentAsString()).get("product_id").asInt();

        mvc.perform(post("/api/stores/1/products/" + pid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.product_id").value(pid))
                .andExpect(jsonPath("$.to_show").value(false));

        mvc.perform(post("/api/stores/1/products/" + pid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already linked")));
    }

    @Test
    void linkingUnknownProductIsNotFound() throws Exception {
        mvc.perform(post("/api/stores/1/products/999999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void storesFilterByMallAndStatus() throws Exception {
        mvc.perform(get("/api/stores").param("mallId", "1").param("status", "available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].mall_id").value(1))
                .andExpect(jsonPath("$[0].status").value("available"));
    }

    @Test
    void storeCrudRoundTrip() throws Exception {
        var created = mvc.perform(post("/api/stores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_name":"Smoke Test Store","mall_id":1}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("available"))
                .andReturn();
        int id = json.readTree(created.getResponse().getContentAsString()).get("store_id").asInt();

        mvc.perform(put("/api/stores/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_name":"Smoke Test Store Renamed","mall_id":1}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.store_name").value("Smoke Test Store Renamed"));

        mvc.perform(delete("/api/stores/" + id))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/stores/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletingRentedStoreConflicts() throws Exception {
        mvc.perform(delete("/api/stores/1"))
                .andExpect(status().isConflict());
    }

    @Test
    void creatingEmployeeRejectsDuplicateEmail() throws Exception {
        mvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Smoke","last_name":"Test","email":"sudarshanamogha@gmail.com","store_id":1}"""))
                .andExpect(status().isConflict());
    }

    @Test
    void creatingEmployeeReturnsCreated() throws Exception {
        mvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"first_name":"Smoke","last_name":"Test","email":"smoke.test@example.com","store_id":1}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.first_name").value("Smoke"))
                .andExpect(jsonPath("$.store_id").value(1));
    }

    @Test
    void bidEventCreateAndDuplicateOpenConflict() throws Exception {
        var created = mvc.perform(post("/api/stores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_name":"Smoke Bid Store","mall_id":1}"""))
                .andExpect(status().isCreated())
                .andReturn();
        int storeId = json.readTree(created.getResponse().getContentAsString()).get("store_id").asInt();

        var event = mvc.perform(post("/api/bid-events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_id":%d,"start_date":"2026-11-01","end_date":"2026-11-10","minimum_bid_amount":1000,"minimum_bid_increment":100}"""
                                .formatted(storeId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.store_id").value(storeId))
                .andExpect(jsonPath("$.status").value("open"))
                .andReturn();
        int eventId = json.readTree(event.getResponse().getContentAsString()).get("event_id").asInt();

        mvc.perform(post("/api/bid-events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"store_id":%d,"start_date":"2026-12-01","end_date":"2026-12-10","minimum_bid_amount":1000,"minimum_bid_increment":100}"""
                                .formatted(storeId)))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/bid-events/" + eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.store_id").value(storeId));
    }

    @Test
    void bidsListByUser() throws Exception {
        mvc.perform(get("/api/bids").param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].user_id").value(1));
        mvc.perform(get("/api/bids").param("userId", "999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void leaveRequestsListByStoreAndStatus() throws Exception {
        mvc.perform(get("/api/leave-requests").param("storeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/leave-requests").param("storeId", "1").param("status", "pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("pending"));
    }

    @Test
    void revenueSubmitAndList() throws Exception {
        mvc.perform(get("/api/tenants/1/revenue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mvc.perform(post("/api/tenants/1/revenue")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Smoke revenue report"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenant_id").value(1))
                .andExpect(jsonPath("$.description").value("Smoke revenue report"));

        mvc.perform(get("/api/tenants/1/revenue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void nearestMallsOrderedByDistance() throws Exception {
        mvc.perform(get("/api/malls/nearest")
                        .param("lat", "40.7128").param("lng", "-74.006").param("limit", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].mall_id").value(1));
    }

    @Test
    void topProductsFilteredByStore() throws Exception {
        mvc.perform(get("/api/malls/1/products/top").param("storeId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].store.store_id").value(2));
    }
}