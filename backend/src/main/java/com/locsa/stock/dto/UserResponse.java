package com.locsa.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String role;
    private String city; // primary city, null for ADMIN
    private boolean active;
    private String avatarUrl;
    private String email;
    private List<String> cities; // all cities (primary + additional)
}
