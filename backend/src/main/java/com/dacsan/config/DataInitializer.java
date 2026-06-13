package com.dacsan.config;

import com.dacsan.entity.User;
import com.dacsan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "admin123";

    private static final List<String> SEED_EMAILS = List.of(
            "admin@dacsan.vn",
            "vendor.hanoi@dacsan.vn",
            "vendor.hue@dacsan.vn",
            "vendor.saigon@dacsan.vn",
            "customer1@gmail.com",
            "customer2@gmail.com");

    @Override
    public void run(String... args) {
        for (String email : SEED_EMAILS) {
            userRepository.findByEmail(email).ifPresent(user -> {
                if (!passwordEncoder.matches(DEFAULT_PASSWORD, user.getPassword())) {
                    String newHash = passwordEncoder.encode(DEFAULT_PASSWORD);
                    user.setPassword(newHash);
                    userRepository.save(user);
                    log.info("Fixed password for seed account: {}", email);
                }
            });
        }
    }
}
