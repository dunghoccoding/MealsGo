package com.dacsan.repository;

import com.dacsan.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findBySubOrderId(Long subOrderId);

    @Query("SELECT DISTINCT oi.product.id FROM OrderItem oi " +
            "WHERE oi.subOrder.order.customer.id = :customerId")
    List<Long> findDistinctProductIdsByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT DISTINCT oi.product FROM OrderItem oi " +
            "WHERE oi.subOrder.order.customer.id = :customerId")
    List<com.dacsan.entity.Product> findDistinctProductsByCustomerId(@Param("customerId") Long customerId);

    /**
     * Tìm sản phẩm đã đặt nhiều lần nhất bởi customer, trả về product ID + tổng số lượng đặt.
     * Kết quả sắp xếp theo tổng quantity giảm dần (đặt nhiều nhất lên đầu).
     */
    /**
     * Trả về list [productId (Long), totalQuantity (Number)] sắp xếp theo totalQuantity giảm dần.
     * Lưu ý: MySQL trả về BigInteger cho productId trong GROUP BY, nên dùng ((Number) row[0]).longValue()
     */
    @Query("SELECT oi.product.id, SUM(oi.quantity) as totalQty FROM OrderItem oi " +
            "WHERE oi.subOrder.order.customer.id = :customerId " +
            "GROUP BY oi.product.id " +
            "ORDER BY totalQty DESC")
    List<Object[]> findFrequentlyOrderedProductIds(@Param("customerId") Long customerId);
}
