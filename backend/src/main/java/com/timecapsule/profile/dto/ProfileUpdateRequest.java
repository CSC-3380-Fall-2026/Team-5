package com.timecapsule.profile.dto;
import jakarta.validation.constraints.*;
public record ProfileUpdateRequest(@NotBlank @Size(max=50) String username,@Size(max=500) String bio,@Size(max=2048) String avatarUrl) {}
