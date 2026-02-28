package br.com.oficina.application.service;

import br.com.oficina.domain.entities.AuditLog;
import br.com.oficina.domain.entities.User;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository repository;
    private final UserContext userContext;

    @Async
    public void log(String action, String entity, String entityId, String details) {
        try {
            User currentUser = userContext.getCurrentUser();
            
            AuditLog log = new AuditLog();
            log.setEnterpriseId(currentUser.getEnterpriseId());
            log.setUserId(currentUser.getId());
            log.setUserName(currentUser.getName());
            
            log.setAction(action);
            log.setEntity(entity);
            log.setEntityId(entityId);
            log.setDetails(details);
            
            repository.save(log);
        } catch (Exception e) {
            System.err.println("Falha ao salvar log de auditoria: " + e.getMessage());
        }
    }
    
    @Async
    public void log(UUID enterpriseId, UUID userId, String userName, String action, String entity, String entityId, String details) {
        AuditLog log = new AuditLog();
        log.setEnterpriseId(enterpriseId);
        log.setUserId(userId);
        log.setUserName(userName);
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setDetails(details);
        repository.save(log);
    }

    public Page<AuditLog> listLogs(Pageable pageable) {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        return repository.findByEnterpriseId(enterpriseId, pageable);
    }
}
