package com.dacsan.entity;

public enum OrderStatus {
    PENDING, // Chờ xác nhận
    CONFIRMED, // Đã xác nhận
    PROCESSING, // Đang xử lý
    PREPARING, // Đang chuẩn bị
    READY, // Sẵn sàng giao
    DELIVERING, // Đang giao
    COMPLETED, // Hoàn thành
    CANCELLED // Đã hủy
}
