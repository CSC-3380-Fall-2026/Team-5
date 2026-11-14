package com.timecapsule.profile.config;
import com.timecapsule.profile.model.UserProfile;
import com.timecapsule.profile.repository.UserProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
@Configuration public class DemoData {
 @Bean CommandLineRunner seed(UserProfileRepository repo){return args->{if(repo.count()==0){UserProfile p=new UserProfile();p.setUsername("Mikayla");p.setBio("Collecting moments for my future self. Same people, different chapters. ♥");p.setAvatarUrl("");repo.save(p);}};}
}
