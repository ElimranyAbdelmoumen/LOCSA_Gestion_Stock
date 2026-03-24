package com.locsa.stock.dto;

import com.locsa.stock.entity.City;
import com.locsa.stock.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Le nom d'utilisateur est requis")
    @Size(min = 3, max = 30, message = "Le nom d'utilisateur doit faire entre 3 et 30 caractères")
    @Pattern(regexp = "^\\S+$", message = "Le nom d'utilisateur ne doit pas contenir d'espaces")
    private String username;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 6, message = "Le mot de passe doit faire au moins 6 caractères")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    private City city; // required for USER, null for ADMIN
}
