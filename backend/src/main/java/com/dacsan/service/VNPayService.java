package com.dacsan.service;

import com.dacsan.config.VNPayConfig;
import com.dacsan.entity.*;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {
        public String createPaymentUrl(Order order, HttpServletRequest request) {
                String vnp_TxnRef = VNPayConfig.getRandomNumber(8);
                long amount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();

                String vnp_TmnCode = VNPayConfig.vnp_TmnCode;
                String vnp_Version = "2.1.0";
                String vnp_Command = "pay";
                String vnp_IpAddr = VNPayConfig.getIpAddress(request);
                String vnp_CurrCode = "VND";
                String vnp_OrderInfo = "Thanh toán đơn mã #" + vnp_TxnRef;
                String vnp_BankCode = "NCB";

                Map<String, String> vnp_Params = new HashMap<>();
                vnp_Params.put("vnp_Version", vnp_Version);
                vnp_Params.put("vnp_Command", vnp_Command);
                vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
                vnp_Params.put("vnp_Amount", String.valueOf(amount));
                vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
                vnp_Params.put("vnp_BankCode", vnp_BankCode);
                vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
                vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
                vnp_Params.put("vnp_OrderType", "other");
                vnp_Params.put("vnp_Locale", "vn");
                vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl);
                vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

                SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
                TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

                Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
                String vnp_CreateDate = formatter.format(calendar.getTime());
                vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

                calendar.add(Calendar.MINUTE, 15);
                String vnp_ExpireDate = formatter.format(calendar.getTime());
                vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

                List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
                Collections.sort(fieldNames);

                StringBuilder hashData = new StringBuilder();
                StringBuilder query = new StringBuilder();

                for (String fieldName : fieldNames) {
                        String fieldValue = vnp_Params.get(fieldName);
                        if (fieldValue != null && !fieldValue.isEmpty()) {
                                hashData.append(fieldName).append('=')
                                                .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=')
                                                .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                                if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
                                        hashData.append('&');
                                        query.append('&');
                                }
                        }
                }

                String vnp_SecureHash = VNPayConfig.hmacSHA512(VNPayConfig.secretKey, hashData.toString());
                query.append("&vnp_SecureHash=").append(vnp_SecureHash);

                String paymentUrl = VNPayConfig.vnp_PayUrl + "?" + query;
                return paymentUrl;
        }

}
