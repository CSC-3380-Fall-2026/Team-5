package com.timecapsule.profile.model;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="user_profiles") public class UserProfile {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=50,unique=true) private String username;
 @Column(length=500) private String bio="";
 @Column(name="avatar_url",length=2048) private String avatarUrl="";
 @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt;
 @Column(name="updated_at",nullable=false) private Instant updatedAt;
 @PrePersist void create(){createdAt=Instant.now();updatedAt=createdAt;}
 @PreUpdate void update(){updatedAt=Instant.now();}
 public Long getId(){return id;} public String getUsername(){return username;} public void setUsername(String s){username=s;}
 public String getBio(){return bio;} public void setBio(String s){bio=s;}
 public String getAvatarUrl(){return avatarUrl;} public void setAvatarUrl(String s){avatarUrl=s;}
 public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
}
