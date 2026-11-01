package com.mallhub.repository;

import com.mallhub.entity.Mall;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/** Count-only queries: the database does all the counting, callers just pass the numbers on. */
public interface CountRepository extends Repository<Mall, Integer> {

    // overall
    @Query("SELECT COUNT(DISTINCT st.id.tenantId) FROM StoreTenant st")
    long tenants();

    @Query("SELECT COUNT(s) FROM Store s")
    long stores();

    @Query("SELECT COUNT(e) FROM Employee e")
    long employees();

    @Query("SELECT COUNT(p) FROM Product p")
    long products();

    // one mall
    @Query("""
            SELECT COUNT(DISTINCT st.id.tenantId) FROM StoreTenant st
            JOIN Store s ON s.storeId = st.id.storeId WHERE s.mallId = :mallId
            """)
    long tenantsInMall(@Param("mallId") Integer mallId);

    @Query("SELECT COUNT(s) FROM Store s WHERE s.mallId = :mallId")
    long storesInMall(@Param("mallId") Integer mallId);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.mallId = :mallId")
    long employeesInMall(@Param("mallId") Integer mallId);

    @Query("""
            SELECT COUNT(DISTINCT sp.id.productId) FROM StoreProduct sp
            JOIN Store s ON s.storeId = sp.id.storeId WHERE s.mallId = :mallId
            """)
    long productsInMall(@Param("mallId") Integer mallId);

    // per mall, GROUP BY; LEFT JOIN from Mall so malls with nothing still appear as 0. Rows are [mallId, count].
    @Query("""
            SELECT m.mallId, COUNT(DISTINCT st.id.tenantId) FROM Mall m
            LEFT JOIN Store s ON s.mallId = m.mallId
            LEFT JOIN StoreTenant st ON st.id.storeId = s.storeId
            GROUP BY m.mallId ORDER BY m.mallId
            """)
    List<Object[]> tenantsByMall();

    @Query("""
            SELECT m.mallId, COUNT(s) FROM Mall m
            LEFT JOIN Store s ON s.mallId = m.mallId
            GROUP BY m.mallId ORDER BY m.mallId
            """)
    List<Object[]> storesByMall();

    @Query("""
            SELECT m.mallId, COUNT(e) FROM Mall m
            LEFT JOIN Employee e ON e.mallId = m.mallId
            GROUP BY m.mallId ORDER BY m.mallId
            """)
    List<Object[]> employeesByMall();

    @Query("""
            SELECT m.mallId, COUNT(DISTINCT sp.id.productId) FROM Mall m
            LEFT JOIN Store s ON s.mallId = m.mallId
            LEFT JOIN StoreProduct sp ON sp.id.storeId = s.storeId
            GROUP BY m.mallId ORDER BY m.mallId
            """)
    List<Object[]> productsByMall();
}
