package br.com.oficina.infrastructure.api.dashboard;

import br.com.oficina.application.service.DashboardService;
import br.com.oficina.domain.entities.DashboardSnapshot;
import br.com.oficina.infrastructure.configuration.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserContext userContext;

    @GetMapping("/history")
    public ResponseEntity<List<DashboardSnapshot>> getHistory() {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        return ResponseEntity.ok(dashboardService.getLast30Days(enterpriseId));
    }

    @GetMapping("/current")
    public ResponseEntity<DashboardSnapshot> getCurrent() {
        UUID enterpriseId = userContext.getCurrentEnterpriseId();
        return ResponseEntity.ok(dashboardService.getCurrentSnapshot(enterpriseId));
    }
}
