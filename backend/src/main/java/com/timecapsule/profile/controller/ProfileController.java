package com.timecapsule.profile.controller;
import com.timecapsule.profile.dto.*;
import com.timecapsule.profile.model.UserProfile;
import com.timecapsule.profile.repository.UserProfileRepository;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
@RestController @RequestMapping("/api/profile") public class ProfileController {
 private final UserProfileRepository repo;
 public ProfileController(UserProfileRepository repo){this.repo=repo;}
 @GetMapping("/{userId}") public ProfileResponse get(@PathVariable Long userId){return ProfileResponse.from(find(userId));}
 @PutMapping("/{userId}") public ProfileResponse update(@PathVariable Long userId,@Valid @RequestBody ProfileUpdateRequest input){
  UserProfile p=find(userId);String name=input.username().trim();
  if(repo.existsByUsernameAndIdNot(name,userId))throw new ResponseStatusException(HttpStatus.CONFLICT,"Username already taken");
  String avatar=input.avatarUrl()==null?"":input.avatarUrl().trim();
  if(!avatar.isEmpty()) {try {URI uri=URI.create(avatar);if(!("https".equalsIgnoreCase(uri.getScheme())||"http".equalsIgnoreCase(uri.getScheme()))||uri.getHost()==null)throw new IllegalArgumentException();}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Avatar URL must be http(s)");}}
  p.setUsername(name);p.setBio(input.bio()==null?"":input.bio().trim());p.setAvatarUrl(avatar);
  return ProfileResponse.from(repo.save(p));
 }
 private UserProfile find(Long id){return repo.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Profile not found"));}
}
