package br.com.oficina.infrastructure.api.mechanic;

import br.com.oficina.application.dto.MechanicRequestDTO;
import br.com.oficina.application.dto.MechanicResponseDTO;
import br.com.oficina.application.service.MechanicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/mechanics")
@RequiredArgsConstructor
public class MechanicController {

	private final MechanicService mechanicService;

	@PostMapping
	public ResponseEntity<MechanicResponseDTO> create(@RequestBody MechanicRequestDTO dto) {
		MechanicResponseDTO savedMechanic = mechanicService.save(dto);
		URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
				.path("/{id}")
				.buildAndExpand(savedMechanic.id())
				.toUri();
		return ResponseEntity.created(uri).body(savedMechanic);
	}

	@GetMapping("/{id}")
	public ResponseEntity<MechanicResponseDTO> findById(@PathVariable UUID id) {
		return ResponseEntity.ok(mechanicService.findById(id));
	}

	@GetMapping("/active")
	public ResponseEntity<List<MechanicResponseDTO>> findAllActive() {
		return ResponseEntity.ok(mechanicService.findAllActive());
	}

	@PutMapping("/{id}")
	public ResponseEntity<MechanicResponseDTO> update(@PathVariable UUID id, @RequestBody MechanicRequestDTO dto) {
		return ResponseEntity.ok(mechanicService.update(id, dto));
	}

	@PatchMapping("/{id}/active")
	public ResponseEntity<MechanicResponseDTO> changeActive(@PathVariable UUID id) {
		return ResponseEntity.ok(mechanicService.changeActive(id));
	}
}
