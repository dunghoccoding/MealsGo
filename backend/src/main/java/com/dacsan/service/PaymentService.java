package com.dacsan.service;

import com.dacsan.config.VNPayConfig;
import com.dacsan.entity.*;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
        public String createVnpayPaymentUrl(Order order, HttpServletRequest request) {
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

        private static final String ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";
        private static final String PARTNER_CODE = "MOMO5RGX20191128";
        private static final String ACCESS_KEY = "M8brj9K6E22vXoDB";
        private static final String SECRET_KEY = "nqQiVSgDMy809JoPF6OzP5OdBUB550Y4";
        private static final String REDIRECT_URL = "http://localhost:3000";
        private static final String IPN_URL = "http://localhost:3000";

        public String createMomoQR(Order order) {
                String orderId = UUID.randomUUID().toString();
                String requestId = UUID.randomUUID().toString();
                long amount = order.getTotalAmount().longValue();

                Map<String, Object> rawData = new TreeMap<>();
                rawData.put("partnerCode", PARTNER_CODE);
                rawData.put("accessKey", ACCESS_KEY);
                rawData.put("requestId", requestId);
                rawData.put("amount", String.valueOf(amount));
                rawData.put("orderId", orderId);
                rawData.put("orderInfo", "Thanh toán đơn hàng qua Momo");
                rawData.put("redirectUrl", REDIRECT_URL);
                rawData.put("ipnUrl", IPN_URL);
                rawData.put("requestType", "captureWallet"); // thay bằng payWithATM
                rawData.put("extraData", "");

                String rawSignature = rawData.entrySet()
                                .stream()
                                .map(entry -> entry.getKey() + "=" + entry.getValue())
                                .collect(Collectors.joining("&"));
                try {
                        String signature = hmacSHA256(rawSignature, SECRET_KEY);
                        rawData.put("signature", signature);

                } catch (Exception e) {
                        e.printStackTrace();
                }

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(rawData, headers);

                RestTemplate restTemplate = new RestTemplate();

                ResponseEntity<Map> response = restTemplate.postForEntity(
                                ENDPOINT,
                                request,
                                Map.class);

                Map<String, Object> result = response.getBody();

                return (String) result.get("payUrl");
        }

        public String createMomoATM(Order order) {
                String orderId = UUID.randomUUID().toString();
                String requestId = UUID.randomUUID().toString();
                long amount = order.getTotalAmount().longValue();

                Map<String, Object> rawData = new TreeMap<>();
                rawData.put("partnerCode", PARTNER_CODE);
                rawData.put("accessKey", ACCESS_KEY);
                rawData.put("requestId", requestId);
                rawData.put("amount", String.valueOf(amount));
                rawData.put("orderId", orderId);
                rawData.put("orderInfo", "Thanh toán đơn hàng qua Momo");
                rawData.put("redirectUrl", REDIRECT_URL);
                rawData.put("ipnUrl", IPN_URL);
                rawData.put("requestType", "payWithATM");
                rawData.put("extraData", "");

                String rawSignature = rawData.entrySet()
                                .stream()
                                .map(entry -> entry.getKey() + "=" + entry.getValue())
                                .collect(Collectors.joining("&"));

                try {
                        String signature = hmacSHA256(rawSignature, SECRET_KEY);
                        rawData.put("signature", signature);

                } catch (Exception e) {
                        e.printStackTrace();
                }

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(rawData, headers);

                RestTemplate restTemplate = new RestTemplate();

                ResponseEntity<Map> response = restTemplate.postForEntity(
                                ENDPOINT,
                                request,
                                Map.class);

                Map<String, Object> result = response.getBody();

                return (String) result.get("payUrl");
        }

        private String hmacSHA256(String data, String key) throws Exception {
                Mac sha256Hmac = Mac.getInstance("HmacSHA256");
                SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
                sha256Hmac.init(secretKey);
                byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                for (byte b : hash)
                        sb.append(String.format("%02x", b));
                return sb.toString();
        }
}
