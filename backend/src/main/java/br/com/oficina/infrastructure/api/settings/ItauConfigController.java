package br.com.oficina.infrastructure.api.settings;

import br.com.oficina.application.service.ItauConfigService;
import br.com.oficina.domain.entities.ItauConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
        // Não retornamos o binário do certificado nem a senha por segurança
        return ResponseEntity.ok(new ItauConfigResponse(
                config.getClientId(),
                config.getClientSecret(),
                config.isActive(),
                config.getCertificateData() != null // Apenas indica se tem certificado
        ));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> saveConfig(
            @RequestParam("clientId") String clientId,
            @RequestParam("clientSecret") String clientSecret,
            @RequestParam("certificatePassword") String certificatePassword,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate
    ) {
        service.saveConfig(clientId, clientSecret, certificatePassword, certificate);
        return ResponseEntity.ok().build();
    }

    public record ItauConfigResponse(String clientId, String clientSecret, boolean active, boolean hasCertificate) {}
}
