package com.dacsan.service;

import com.dacsan.dto.response.UploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class UploadService {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private int serverPort;

    public UploadResponse uploadImage(MultipartFile file) throws IOException {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Validate file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must not exceed 10MB");
        }

        log.info("Uploading image locally: {} (size: {} bytes)", file.getOriginalFilename(), file.getSize());

        // Create uploads directory if not exists
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        // Save file using Files.copy for reliability
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        // Get image dimensions
        Integer width = null;
        Integer height = null;
        try {
            BufferedImage img = ImageIO.read(filePath.toFile());
            if (img != null) {
                width = img.getWidth();
                height = img.getHeight();
            }
        } catch (Exception e) {
            log.warn("Could not read image dimensions for {}", uniqueFilename);
        }

        // Build URL (served via /uploads/ path)
        String url = "/uploads/" + uniqueFilename;

        log.info("Upload successful. File saved: {}", filePath.toAbsolutePath());

        return UploadResponse.builder()
                .url(url)
                .publicId(uniqueFilename)
                .format(extension.replace(".", ""))
                .size(file.getSize())
                .width(width)
                .height(height)
                .build();
    }

    public void deleteImage(String publicId) throws IOException {
        log.info("Deleting image: {}", publicId);
        Path filePath = Paths.get(uploadDir).resolve(publicId);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.info("Image deleted successfully: {}", publicId);
        } else {
            log.warn("Image not found: {}", publicId);
        }
    }
}
