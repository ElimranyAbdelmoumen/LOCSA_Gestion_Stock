package com.locsa.stock.dto;

import com.locsa.stock.entity.City;
import com.locsa.stock.entity.Role;
import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Data
public class UpdateUserRequest {
    private String username;
    private Role role;
    private City city;
    private Set<City> additionalCities = new HashSet<>();
    private String email;
}
