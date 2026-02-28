package br.com.oficina.domain.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private UUID id = UUID.randomUUID();
    private UUID enterpriseId;
    private UUID userId;
    private String userName;
    private String action;      // CREATE, UPDATE, DELETE, LOGIN
    private String entity;      // Client, ServiceOrder, etc
    private String entityId;    // ID do objeto manipulado
    private String details;     // Descrição ou JSON das mudanças
    private LocalDateTime timestamp = LocalDateTime.now();
}
