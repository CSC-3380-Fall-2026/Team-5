package com.timecapsule.profile.repository;
import com.timecapsule.profile.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserProfileRepository extends JpaRepository<UserProfile,Long> { boolean existsByUsernameAndIdNot(String username,Long id); }
