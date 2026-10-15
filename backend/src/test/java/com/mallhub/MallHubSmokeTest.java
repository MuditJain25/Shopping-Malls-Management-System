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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
}