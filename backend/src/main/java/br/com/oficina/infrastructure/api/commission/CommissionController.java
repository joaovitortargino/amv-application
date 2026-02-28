package br.com.oficina.infrastructure.api.commission;

import br.com.oficina.application.service.CommissionService;
import br.com.oficina.domain.entities.Commissions;
import br.com.oficina.domain.entities.FinancialTitle;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/commissions")
@RequiredArgsConstructor
public class CommissionController {

	private final CommissionService commissionService;

	@GetMapping("/mechanic/{mechanicId}")
	public ResponseEntity<List<Commissions>> findByMechanic(@PathVariable UUID mechanicId) {
		return ResponseEntity.ok(commissionService.findByMechanicId(mechanicId));
	}

	@GetMapping("/os/{osId}")
	public ResponseEntity<List<Commissions>> findByOs(@PathVariable UUID osId) {
		return ResponseEntity.ok(commissionService.findByOsId(osId));
	}

	@PostMapping("/pay")
	public ResponseEntity<FinancialTitle> payCommissions(@RequestBody PayCommissionsDTO dto) {
		FinancialTitle title = commissionService.payCommissions(dto.commissionIds());
		return ResponseEntity.ok(title);
	}

	public record PayCommissionsDTO(List<UUID> commissionIds) {}
}