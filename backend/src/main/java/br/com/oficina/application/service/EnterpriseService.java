package br.com.oficina.application.service;

import br.com.oficina.domain.entities.Enterprise;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.EnterpriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnterpriseService {

    private final EnterpriseRepository repository;
    private final UserContext userContext;
    private final AuditService auditService;

    public Enterprise getCurrentEnterprise() {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        return repository.findById(enterpriseId)
                .orElseThrow(() -> new RuntimeException("Enterprise not found"));
    }

    @Transactional
    public Enterprise update(Enterprise updatedData) {
        Enterprise enterprise = getCurrentEnterprise();
        
        // Mantém dados sensíveis que não devem ser alterados via settings simples
        updatedData.setId(enterprise.getId());
        updatedData.setCnpj(enterprise.getCnpj()); // CNPJ geralmente não muda
        updatedData.setCreatedAt(enterprise.getCreatedAt());
        updatedData.setActive(enterprise.isActive());
        
        // Atualiza campos permitidos
        enterprise.setFantasyName(updatedData.getFantasyName());
        enterprise.setCorporateReason(updatedData.getCorporateReason());
        enterprise.setAddress(updatedData.getAddress());
        enterprise.setContact(updatedData.getContact());
        
        Enterprise saved = repository.save(enterprise);
        
        auditService.log("UPDATE", "Enterprise", saved.getId().toString(), "Updated enterprise settings");
        
        return saved;
    }
}
