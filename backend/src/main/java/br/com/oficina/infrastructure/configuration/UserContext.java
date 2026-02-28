package br.com.oficina.infrastructure.configuration;

import br.com.oficina.domain.entities.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserContext {

    public UUID getCurrentEnterpriseId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            if (user.getEnterpriseId() != null) {
                return user.getEnterpriseId();
            }
        }
        
        // Em caso de erro ou usuário não autenticado corretamente (não deveria acontecer em rotas protegidas)
        throw new IllegalStateException("User is not authenticated or does not have an enterprise associated");
    }
    
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new IllegalStateException("User is not authenticated");
    }
}
