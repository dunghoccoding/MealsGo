package com.dacsan.service;

import com.dacsan.dto.request.AddressRequest;
import com.dacsan.dto.response.AddressResponse;
import com.dacsan.entity.Address;
import com.dacsan.entity.User;
import com.dacsan.exception.NotFoundException;
import com.dacsan.repository.AddressRepository;
import com.dacsan.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    private final AddressRepository addressRepository;

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses() {
        User currentUser = SecurityUtils.getCurrentUser();
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDesc(currentUser.getId());

        return addresses.stream()
                .map(this::buildAddressResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse createAddress(AddressRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();

        // If this is the first address or explicitly set as default, make it default
        List<Address> existingAddresses = addressRepository.findByUserIdOrderByIsDefaultDesc(currentUser.getId());
        boolean shouldBeDefault = existingAddresses.isEmpty() || request.getIsDefault();

        // If setting as default, unset other defaults
        if (shouldBeDefault) {
            existingAddresses.stream()
                    .filter(Address::getIsDefault)
                    .forEach(addr -> {
                        addr.setIsDefault(false);
                        addressRepository.save(addr);
                    });
        }

        Address address = Address.builder()
                .user(currentUser)
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .addressLine(request.getAddressLine())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .isDefault(shouldBeDefault)
                .label(request.getLabel())
                .build();

        address = addressRepository.save(address);
        log.info("Created address {} for user {}", address.getId(), currentUser.getId());

        return buildAddressResponse(address);
    }

    @Transactional
    public AddressResponse updateAddress(Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new NotFoundException("Address not found"));

        // Verify ownership
        User currentUser = SecurityUtils.getCurrentUser();
        if (!address.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Address does not belong to current user");
        }

        // If setting as default, unset other defaults
        if (request.getIsDefault() && !address.getIsDefault()) {
            addressRepository.findByUserIdOrderByIsDefaultDesc(currentUser.getId()).stream()
                    .filter(Address::getIsDefault)
                    .forEach(addr -> {
                        addr.setIsDefault(false);
                        addressRepository.save(addr);
                    });
        }

        address.setRecipientName(request.getRecipientName());
        address.setRecipientPhone(request.getRecipientPhone());
        address.setAddressLine(request.getAddressLine());
        address.setWard(request.getWard());
        address.setDistrict(request.getDistrict());
        address.setCity(request.getCity());
        address.setIsDefault(request.getIsDefault());
        address.setLabel(request.getLabel());

        address = addressRepository.save(address);
        log.info("Updated address {}", addressId);

        return buildAddressResponse(address);
    }

    @Transactional
    public void deleteAddress(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new NotFoundException("Address not found"));

        // Verify ownership
        User currentUser = SecurityUtils.getCurrentUser();
        if (!address.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Address does not belong to current user");
        }

        // Prevent deleting default address if it's the only one
        if (address.getIsDefault()) {
            long addressCount = addressRepository.findByUserIdOrderByIsDefaultDesc(currentUser.getId()).size();
            if (addressCount > 1) {
                throw new IllegalArgumentException(
                        "Cannot delete default address. Please set another address as default first.");
            }
        }

        addressRepository.delete(address);
        log.info("Deleted address {}", addressId);
    }

    @Transactional
    public AddressResponse setDefaultAddress(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new NotFoundException("Address not found"));

        // Verify ownership
        User currentUser = SecurityUtils.getCurrentUser();
        if (!address.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Address does not belong to current user");
        }

        // Unset other defaults
        addressRepository.findByUserIdOrderByIsDefaultDesc(currentUser.getId()).stream()
                .filter(Address::getIsDefault)
                .forEach(addr -> {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                });

        address.setIsDefault(true);
        address = addressRepository.save(address);

        log.info("Set address {} as default", addressId);

        return buildAddressResponse(address);
    }

    private AddressResponse buildAddressResponse(Address address) {
        String fullAddress = String.format("%s, %s, %s, %s",
                address.getAddressLine(),
                address.getWard(),
                address.getDistrict(),
                address.getCity());

        return AddressResponse.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .recipientPhone(address.getRecipientPhone())
                .addressLine(address.getAddressLine())
                .ward(address.getWard())
                .district(address.getDistrict())
                .city(address.getCity())
                .fullAddress(fullAddress)
                .isDefault(address.getIsDefault())
                .label(address.getLabel())
                .build();
    }
}
