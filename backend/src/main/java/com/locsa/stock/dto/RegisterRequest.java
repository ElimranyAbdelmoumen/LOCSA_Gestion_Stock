package com.locsa.stock.dto;

import com.locsa.stock.entity.City;
import com.locsa.stock.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Data
public class RegisterRequest {

    @NotBlank(message = "Le nom d'utilisateur est requis")
    @Size(min = 2, max = 50, message = "Le nom d'utilisateur doit faire entre 2 et 50 caractères")
    private String username;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 6, message = "Le mot de passe doit faire au moins 6 caractères")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    private City city; // primary city, required for USER

    private Set<City> additionalCities = new HashSet<>(); // extra cities for USER

    @NotBlank(message = "L'email est requis")
    @jakarta.validation.constraints.Email(message = "Email invalide")
    private String email; // required — used for login and welcome email
}
