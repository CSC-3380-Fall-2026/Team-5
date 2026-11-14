package com.timecapsule.profile.dto;
import com.timecapsule.profile.model.UserProfile;
import java.time.Instant;
public record ProfileResponse(Long id,String username,String bio,String avatarUrl,Instant createdAt,Instant updatedAt){
 public static ProfileResponse from(UserProfile p){return new ProfileResponse(p.getId(),p.getUsername(),p.getBio(),p.getAvatarUrl(),p.getCreatedAt(),p.getUpdatedAt());}
}
