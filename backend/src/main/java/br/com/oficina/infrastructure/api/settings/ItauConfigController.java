package br.com.oficina.infrastructure.api.settings;

import br.com.oficina.application.service.ItauConfigService;
import br.com.oficina.domain.entities.ItauConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/settings/itau")
@RequiredArgsConstructor
public class ItauConfigController {

    private final ItauConfigService service;

    @GetMapping
    public ResponseEntity<ItauConfigResponse> getConfig() {
        ItauConfig config = service.getConfig();
        if (config == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(new ItauConfigResponse(
                config.getClientId(),
                config.getClientSecret() != null && !config.getClientSecret().isBlank(),
                config.getEnvironment(),
                config.getBeneficiaryId(),
                config.getWalletCode(),
                config.getBoletoProcessStage(),
                config.getAuthUrl(),
                config.getApiUrl(),
                config.getQueryUrl(),
                config.getScope(),
                config.getSandboxToken() != null && !config.getSandboxToken().isBlank(),
                config.isActive(),
                config.getCertificateData() != null
        ));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> saveConfig(
            @RequestParam("clientId") String clientId,
            @RequestParam(value = "clientSecret", required = false) String clientSecret,
            @RequestParam(value = "certificatePassword", required = false) String certificatePassword,
            @RequestParam(value = "environment", required = false) String environment,
            @RequestParam(value = "beneficiaryId", required = false) String beneficiaryId,
            @RequestParam(value = "walletCode", required = false) String walletCode,
            @RequestParam(value = "boletoProcessStage", required = false) String boletoProcessStage,
            @RequestParam(value = "authUrl", required = false) String authUrl,
            @RequestParam(value = "apiUrl", required = false) String apiUrl,
            @RequestParam(value = "queryUrl", required = false) String queryUrl,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "sandboxToken", required = false) String sandboxToken,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate
    ) {
        service.saveConfig(
                clientId,
                clientSecret,
                certificatePassword,
                environment,
                beneficiaryId,
                walletCode,
                boletoProcessStage,
                authUrl,
                apiUrl,
                queryUrl,
                scope,
                sandboxToken,
                certificate
        );
        return ResponseEntity.ok().build();
    }

    public record ItauConfigResponse(
            String clientId,
            boolean hasClientSecret,
            String environment,
            String beneficiaryId,
            String walletCode,
            String boletoProcessStage,
            String authUrl,
            String apiUrl,
            String queryUrl,
            String scope,
            boolean hasSandboxToken,
            boolean active,
            boolean hasCertificate
    ) {}
}
