package br.com.oficina.application.service;

import br.com.oficina.domain.entities.User;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final UserContext userContext;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public User getCurrentUser() {
        return userContext.getCurrentUser();
    }

    @Transactional
    public User updateProfile(String name, String newPassword) {
        User user = getCurrentUser();
        
        boolean changed = false;
        if (name != null && !name.isBlank() && !name.equals(user.getName())) {
            user.setName(name);
            changed = true;
        }
        
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
            changed = true;
        }
        
        if (changed) {
            User saved = repository.save(user);
            auditService.log("UPDATE", "User", saved.getId().toString(), "Updated user profile");
            return saved;
        }
        
        return user;
    }
}
