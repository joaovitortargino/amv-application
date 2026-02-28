package br.com.oficina.application.service;

import br.com.oficina.domain.entities.ItauConfig;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.ItauConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItauConfigService {

    private final ItauConfigRepository repository;
    private final UserContext userContext;
    private final AuditService auditService;

    @Transactional
    public void saveConfig(String clientId, String clientSecret, String certPassword, MultipartFile certificateFile) {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        
        ItauConfig config = repository.findByEnterpriseId(enterpriseId)
                .orElse(new ItauConfig());
        
        if (config.getId() == null) {
            config.setEnterpriseId(enterpriseId);
        }

        config.setClientId(clientId);
        config.setClientSecret(clientSecret);
        config.setCertificatePassword(certPassword);
        config.setActive(true);

        if (certificateFile != null && !certificateFile.isEmpty()) {
            try {
                config.setCertificateData(certificateFile.getBytes());
            } catch (IOException e) {
                throw new RuntimeException("Failed to read certificate file", e);
            }
        } else if (config.getCertificateData() == null) {
             throw new IllegalArgumentException("Certificate file is required for initial setup");
        }

        repository.save(config);
        auditService.log("UPDATE", "ItauConfig", config.getId().toString(), "Updated Itau configuration");
    }

    public ItauConfig getConfig() {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        return repository.findByEnterpriseId(enterpriseId).orElse(null);
    }
    
    public ItauConfig getConfigByEnterpriseId(UUID enterpriseId) {
        return repository.findByEnterpriseId(enterpriseId).orElse(null);
    }
}
