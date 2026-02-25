package com.dacsan.controller;

import com.dacsan.dto.response.UploadResponse;
import com.dacsan.service.UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "Upload", description = "File upload endpoints")
public class UploadController {

    private final UploadService uploadService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @Operation(summary = "Upload image", description = "Upload an image to Cloudinary. Only vendors and admins can upload.")
    public ResponseEntity<UploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        UploadResponse response = uploadService.uploadImage(file);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/image/{publicId}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @Operation(summary = "Delete image", description = "Delete an image from Cloudinary")
    public ResponseEntity<Void> deleteImage(@PathVariable String publicId) throws IOException {
        uploadService.deleteImage(publicId);
        return ResponseEntity.noContent().build();
    }
}
