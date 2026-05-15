package br.com.oficina.application.service;

import br.com.oficina.domain.entities.ItauConfig;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.ItauConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItauConfigService {

    private final ItauConfigRepository repository;
    private final UserContext userContext;
    private final AuditService auditService;

    @Transactional
    public void saveConfig(
            String clientId,
            String clientSecret,
            String certPassword,
            String environment,
            String beneficiaryId,
            String walletCode,
            String boletoProcessStage,
            String authUrl,
            String apiUrl,
            String queryUrl,
            String scope,
            String sandboxToken,
            MultipartFile certificateFile
    ) {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        
        ItauConfig config = repository.findByEnterpriseId(enterpriseId)
                .orElse(new ItauConfig());
        
        config.setEnterpriseId(enterpriseId);

        if (isBlank(clientId)) {
            throw new IllegalArgumentException("Client ID is required");
        }
        if (isBlank(clientSecret) && isBlank(config.getClientSecret())) {
            throw new IllegalArgumentException("Client Secret is required");
        }
        if (isBlank(beneficiaryId)) {
            throw new IllegalArgumentException("Beneficiary ID is required");
        }

        String normalizedEnvironment = defaultIfBlank(environment, "SANDBOX").toUpperCase();
        boolean sandbox = "SANDBOX".equals(normalizedEnvironment);

        if (sandbox && isBlank(sandboxToken) && isBlank(config.getSandboxToken())) {
            throw new IllegalArgumentException("Sandbox Token is required for sandbox setup");
        }

        config.setClientId(clientId);
        if (!isBlank(clientSecret)) {
            config.setClientSecret(clientSecret);
        }
        config.setEnvironment(normalizedEnvironment);
        config.setBeneficiaryId(beneficiaryId);
        config.setWalletCode(defaultIfBlank(walletCode, "109"));
        config.setBoletoProcessStage(defaultIfBlank(boletoProcessStage, "efetivacao"));
        config.setAuthUrl(trimToNull(authUrl));
        config.setApiUrl(trimToNull(apiUrl));
        config.setQueryUrl(trimToNull(queryUrl));
        config.setScope(trimToNull(scope));
        if (!isBlank(sandboxToken)) {
            config.setSandboxToken(sandboxToken.trim());
        }
        config.setActive(true);

        if (certificateFile != null && !certificateFile.isEmpty()) {
            if (isBlank(certPassword)) {
                throw new IllegalArgumentException("Certificate password is required when replacing the certificate");
            }
            try {
                config.setCertificateData(certificateFile.getBytes());
                config.setCertificatePassword(certPassword);
            } catch (IOException e) {
                throw new RuntimeException("Failed to read certificate file", e);
            }
        } else if (!isBlank(certPassword)) {
            config.setCertificatePassword(certPassword);
        } else if ("PRODUCTION".equals(normalizedEnvironment) && config.getCertificateData() == null) {
            throw new IllegalArgumentException("Certificate file is required for production setup");
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

    public List<ItauConfig> listActiveProductionConfigs() {
        return repository.findByActiveTrueAndEnvironmentIgnoreCase("PRODUCTION");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return isBlank(value) ? defaultValue : value.trim();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
