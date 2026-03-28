package com.locsa.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(20)")
    private City city; // primary city, null for ADMIN

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_additional_cities", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "city")
    @Builder.Default
    private Set<City> additionalCities = new HashSet<>();

    @Column(nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean active = true;

    @Column(length = 255)
    private String avatarPath; // relative path under upload dir, e.g. "avatars/3.jpg"

    @Column(unique = true, length = 100)
    private String email;
}
