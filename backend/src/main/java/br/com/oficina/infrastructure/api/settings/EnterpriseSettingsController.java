package br.com.oficina.infrastructure.api.settings;

import br.com.oficina.application.service.EnterpriseService;
import br.com.oficina.domain.entities.Enterprise;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings/enterprise")
@RequiredArgsConstructor
public class EnterpriseSettingsController {

    private final EnterpriseService enterpriseService;

    @GetMapping
    public ResponseEntity<Enterprise> getSettings() {
        return ResponseEntity.ok(enterpriseService.getCurrentEnterprise());
    }

    @PutMapping
    public ResponseEntity<Enterprise> updateSettings(@RequestBody Enterprise enterprise) {
        return ResponseEntity.ok(enterpriseService.update(enterprise));
    }
}
