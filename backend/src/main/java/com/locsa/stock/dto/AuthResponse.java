package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String city; // primary city, null for ADMIN
    private Long id;
    private String avatarUrl;
    private List<String> cities; // all cities (primary + additional)
}
