package com.dacsan.entity;

public enum SubOrderStatus {
    PENDING, // Chờ bếp xác nhận
    COOKING, // Đang nấu
    READY, // Đã nấu xong
    PICKED_UP, // Đã nấu xong
    DELIVERED, // Đã giao
    CANCELLED // Đã hủy
}
