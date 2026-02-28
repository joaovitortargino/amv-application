package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, UUID> {
    Page<AuditLog> findByEnterpriseId(UUID enterpriseId, Pageable pageable);
}
